import { CustomerProfile } from "@/app/models/customer-profile-model";
import newProduct from "@/app/models/new-product-model";
import { Order } from "@/app/models/order-model";
import connectMongo from "@/services/mongo";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongo();

  try {
    const orders = await Order.find()
      .populate({
        path: "customer",
        model: CustomerProfile,
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}

export async function POST(request) {
  await connectMongo();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await request.json();
    // console.log(body);
    // Process payment
    let paymentData = null;
    if (body.payment_info.method !== "cash-in-hand") {
      // Calculate the minimum required amount
      const minimumAmount = 2000 + body.shipping_details.shipping_charge;

      // Determine the actual payment amount
      const actualAmount =
        body.payment_info.amount > minimumAmount
          ? minimumAmount
          : body.payment_info.amount;

      paymentData =
        body.payment_info.method === "cash-on-delivery"
          ? await createBkashPayment(
              actualAmount,
              body.order_number,
              body.customer.phone_number
            )
          : await createBkashPayment(
              body.payment_info.amount,
              body.order_number,
              body.customer.phone_number
            );

      body.payment_info.provider = "bkash";
      body.paymentID = paymentData.paymentID;
      body.bkashURL = paymentData.bkashURL;
    }

    // Check and update stock
    await updateProductStock(body.items, session);

    // Create or update customer
    if (body.customer) {
      body.email = body?.customer?.email;
      body.customer_name = body?.customer?.customer_name;
      body.phone_number = body?.customer?.phone_number;
      body.customer = await createOrUpdateCustomer(body.customer, session);
    }

    // Create order
    const [order] = await Order.create([body], { session });

    // Update customer orders
    await CustomerProfile.findByIdAndUpdate(
      body.customer,
      { $push: { orders: order._id } },
      { session }
    );

    await session.commitTransaction();

    // Send confirmation email
    if (body.email) {
      await sendOrderConfirmationEmail(order, body.email, body);
    }

    return NextResponse.json({
      message: "Order created successfully",
      success: true,
      payment_url: body.bkashURL,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
async function sendOrderConfirmationEmail(order, customerEmail, body) {
  console.log("order on main order", order);
  const mailOptions = {
    to: customerEmail,
    subject: `Order Confirmation for #${order.order_number} - Thank you for your purchase!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .logo { max-width: 150px; }
            .order-details { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0; }
            .item-list { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .item-list th, .item-list td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
            .item-list th { background-color: #f8f9fa; }
            .total { background-color: #f8f9fa; padding: 15px; margin-top: 20px; text-align: right; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; }
            .button { background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .shipping-info { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://res.cloudinary.com/dwe6gs8sp/image/upload/v1734704694/ecom_nrtlmo.png" alt="Store Logo" class="logo">
              <h1 style="color: #007bff;">Order Confirmation</h1>
              <p>Order #${order?.order_number}</p>
            </div>

            <div class="order-details">
              <h2>Thank you for your purchase!</h2>
              <p>Dear ${body?.customer_name},</p>
              <p>We're excited to confirm your order has been successfully placed.</p>

              <div class="shipping-info">
                <h3>Shipping Details</h3>
                <p><strong>Name:</strong> ${body?.customer_name}</p>
                <p><strong>Phone Number:</strong> ${body?.phone_number}</p>
                <p><strong>Email:</strong> ${body?.email}</p>
                <p><strong>Address:</strong> ${
                  order?.shipping_details.address
                }</p>
              </div>

              <h3>Order Summary</h3>
              <table class="item-list">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order?.items
                    .map(
                      (item) => `
                    <tr>
                      <td>
                        <p>${item.model}</p>
                      </td>
                      <td>${item.quantity}</td>
                      <td>${item.price}</td>
                      <td>${item.quantity * item.price}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <div class="total">
                <p><strong>Subtotal:</strong> ৳${
                  order?.total_amount - order?.shipping_details.shipping_charge
                }</p>
                <p><strong>Shipping:</strong> ৳${
                  order?.shipping_details.shipping_charge
                }</p>
                <p style="font-size: 1.2em;"><strong>Total Amount:</strong> ৳${
                  order?.total_amount
                }</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px;">
                <h3>Need Help?</h3>
                <p>If you have any questions, please contact our customer service:</p>
                <p>Email: eshop@gmail.com</p>
                <p>Phone: 01644556543</p>
                <p>website: <a href="https://www.eshop.com" target="_blank">www.eshop.com</a></p>
              </div>
            </div>

            <div class="footer">
              <p>Follow us on social media</p>
              <div style="margin: 15px 0;">
                <a href="https://www.facebook.com/eshop" style="margin: 0 10px;">Facebook</a>
                <a href="https://www.instagram.com/eshop/" style="margin: 0 10px;">Instagram</a>
                <a href="https://www.youtube.com/@eshop" style="margin: 0 10px;">Youtube</a>
              </div>
              <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL_DEV}/api/sendmail`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Website-Origin": "true",
        },
        body: JSON.stringify(mailOptions),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to send email");
    }

    console.log(`Mail sent successfully to ${customerEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
async function createBkashPayment(
  amount,
  merchantInvoiceNumber,
  payerReference
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL_DEV}/api/pgw/bkash/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Origin": "true",
      },
      body: JSON.stringify({
        amount,
        merchantInvoiceNumber,
        payerReference,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create bKash payment");
  }

  return res.json();
}

async function updateProductStock(items, session) {
  for (const item of items) {
    const product = await newProduct.findById(item.id).session(session);
    if (!product) {
      throw new Error(`Product with ID ${item.id} not found`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }
    product.stock -= item.quantity;
    product.sold_out += item.quantity;
    await product.save({ session });
  }
}

async function createOrUpdateCustomer(customerData, session) {
  let customer = await CustomerProfile.findOne({
    phone_number: customerData.phone_number,
  }).session(session);

  if (!customer) {
    const [newCustomer] = await CustomerProfile.create([customerData], {
      session,
    });
    return newCustomer._id;
  }

  return customer._id;
}
