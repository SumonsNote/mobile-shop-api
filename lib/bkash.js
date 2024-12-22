import { cache } from "react";

let tokenCache = null;

async function refreshToken(refreshToken) {
  const response = await fetch(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
        refresh_token: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to refresh bKash token");
  }

  const data = await response.json();
  return {
    token: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token,
  };
}

const getToken = cache(async () => {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  if (tokenCache && tokenCache.refreshToken) {
    try {
      tokenCache = await refreshToken(tokenCache.refreshToken);
      return tokenCache.token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      // If refresh fails, fall through to requesting a new token
    }
  }

  const response = await fetch(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get bKash token");
  }

  const data = await response.json();
  tokenCache = {
    token: data.id_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token,
  };
  return tokenCache.token;
});

export async function createPayment(
  amount,
  merchantInvoiceNumber,
  payerReference
) {
  const token = await getToken();

  const response = await fetch(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "X-APP-Key": process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: payerReference,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL_DEV}/api/pgw/bkash/callback`,
        amount: amount.toFixed(2),
        // amount: 1,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create bKash payment");
  }

  return response.json();
}

export async function executePayment(paymentID) {
  const token = await getToken();

  const response = await fetch(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "X-APP-Key": process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to execute bKash payment");
  }

  return response.json();
}
