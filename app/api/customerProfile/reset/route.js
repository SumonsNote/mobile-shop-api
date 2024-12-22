import { CustomerProfile } from "@/app/models/customer-profile-model";
import connectMongo from "@/services/mongo";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongo();

    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    // Hash the token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find customer with the token
    const customer = await CustomerProfile.findOne({
      passwordResetToken: tokenHash,
      // passwordResetExpires: { $gt: new Date() }, // Check token is not expired
    });
    // console.log(
    //   "passwordResetExpires (ms):",
    //   new Date(customer.passwordResetExpires).getTime()
    // );
    // console.log("Current time (ms):", Date.now());
    // const remainingTime =
    //   new Date(customer.passwordResetExpires).getTime() - Date.now(); // In milliseconds
    // console.log(`Remaining time: ${remainingTime / 1000} seconds`); // Convert to seconds

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Update password
    customer.password = await bcrypt.hash(newPassword, 10);
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save();

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error in reset password handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
// passwordResetToken: { type: String },
// passwordResetExpires: { type: Date },
