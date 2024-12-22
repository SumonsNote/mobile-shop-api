import { CustomerProfile } from "@/app/models/customer-profile-model";
import newProduct from "@/app/models/new-product-model";
import { Order } from "@/app/models/order-model";
import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await connectMongo();
  const id = (await params).orderId;

  try {
    const order = await Order.findById(id).populate({
      path: "customer",
      model: CustomerProfile,
    });
    // console.log("order", order);

    return NextResponse.json({
      success: true,
      order: {
        ...order.toObject(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectMongo();
    const orderId = (await params).orderId;
    const { status, payment_info } = await req.json();

    const order = await Order.findById(orderId).populate({
      path: "customer",
      model: CustomerProfile,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status === "cancelled") {
      if (order.status === "cancelled") {
        return NextResponse.json(
          { error: "Order is already cancelled" },
          { status: 400 }
        );
      }

      await updateProductStock(order.items);

      order.status = status;
      if (payment_info) {
        order.payment_info = payment_info;
      }
      await order.save();

      await sendCancellationEmail(order);

      return NextResponse.json({
        success: true,
        order: order.toObject(),
      });
    }

    // Handle non-cancel status updates
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, payment_info },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order update failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder.toObject(),
    });
  } catch (error) {
    console.error("Error in PUT /api/orders/[orderId]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
async function updateProductStock(items) {
  for (const item of items) {
    if (!item._id || !item.quantity) {
      throw new Error("Invalid product details in order");
    }
    const product = await newProduct.findById(item.id);
    if (!product) {
      throw new Error(`Product not found for ID: ${item.id}`);
    }
    product.stock += item.quantity;
    product.sold_out -= item.quantity;
    await product.save();
  }
}

async function sendCancellationEmail(order) {
  console.log("order on single put", order?.createdAt);
  if (!order?.customer?.email) {
    console.log("No email address available");
    return;
  }
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleString("en-US", {
    timeZone: "Asia/Dhaka", // Explicitly set Bangladesh timezone
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const mailOptions = {
    to: order.customer.email,
    subject: `Order Cancellation for #${order.order_number}!`,
    html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Order Cancellation Confirmation</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #f0f4f8;
                        }
                        .container {
                            background-color: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                            color: white;
                            text-align: center;
                            padding: 20px;
                        }
                        .content {
                            padding: 25px;
                        }
                        .order-details {
                            background-color: #f1f5f9;
                            border-left: 4px solid #2575fc;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            background-color: #e2e8f0;
                            text-align: center;
                            padding: 15px;
                            font-size: 0.9em;
                            color: #4a5568;
                        }
                        .cta-button {
                            display: inline-block;
                            border:1px solid #2575fc;
                            color: white;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                            margin-top: 15px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Order Cancellation Confirmed</h1>
                        </div>
                        
                        <div class="content">
                            <p>Hi ${order.customer?.customer_name},</p>
                            
                            <p>Your order has been successfully cancelled.</p>
                            
                            <div class="order-details">
                                <h3>Order Summary</h3>
                                <p><strong>Order #:</strong> ${
                                  order.order_number
                                }</p>
                                <p><strong>Order Date:</strong> ${formattedDate}</p>
                                <p><strong>Total Amount:</strong> ${
                                  order.total_amount
                                }</p>
                                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                            
                            <p>If you have any questions or concerns, please do not hesitate to contact us.</p>
                            
                            <a href="tel:+8801704282029" class="cta-button">Contact Support</a>
                        </div>
                        
                        <div class="footer">
                            © ${new Date().getFullYear()} eShop • All Rights Reserved
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
    if (!res.ok) throw new Error("Failed to send email");
    console.log(`Mail sent successfully to ${order.customer.email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    // Consider whether to throw this error or just log it
  }
}
