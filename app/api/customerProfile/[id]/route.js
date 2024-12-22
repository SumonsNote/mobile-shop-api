import { CustomerProfile } from "@/app/models/customer-profile-model";
import connectMongo from "@/services/mongo";
import crypto from "crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
// forget password
export async function POST(req) {
  try {
    await connectMongo();

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const customer = await CustomerProfile.findOne({ email });
    if (!customer) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(4).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    customer.passwordResetToken = resetTokenHash;
    customer.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await customer.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or any email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      subject: "Password Reset Request",
      text: `Here is your password reset token: ${resetToken}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "Password reset token sent to email.",
    });
  } catch (error) {
    console.error("Error in forgot password handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
// /update data
export async function PUT(req) {
  try {
    await connectMongo();
    const data = await req.json();
    console.log(data);
    const { id, name, phone, email, address } = data;

    // Find customer by ID
    const customer = await CustomerProfile.findById(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    console.log(customer);
    // Update customer details
    if (name) customer.customer_name = name;
    if (phone) customer.phone_number = phone;
    if (email) customer.email = email;
    if (address) customer.address = address;

    await customer.save();

    // Send success response
    return NextResponse.json(
      { message: "Customer updated successfully.", customer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT handler:", error);

    // Send error response
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    await connectMongo();
    const id = params.id;
    if (id) {
      const customer = await CustomerProfile.findById(id);
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 404 }
        );
      }
      return NextResponse.json(customer, { status: 200 });
    } else {
      const customers = await CustomerProfile.find();
      return NextResponse.json(customers, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
export async function DELETE(req, { params }) {
  try {
    await connectMongo();
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    const customer = await CustomerProfile.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Customer successfully deleted.", customer },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
