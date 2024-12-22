import { createPayment } from "@/lib/bkash";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, merchantInvoiceNumber, payerReference } =
      await request.json();
    if (!amount || !merchantInvoiceNumber) {
      return NextResponse.json(
        { error: "Amount and merchantInvoiceNumber are required" },
        { status: 400 }
      );
    }

    const paymentResponse = await createPayment(
      amount,
      merchantInvoiceNumber,
      payerReference
    );

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error("Error creating bKash payment:", error);
    return NextResponse.json(
      { error: "Failed to create bKash payment" },
      { status: 500 }
    );
  }
}
