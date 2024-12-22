import { CustomerProfile } from "@/app/models/customer-profile-model";
import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";
import { Order } from "../../models/order-model";
import bcrypt from "bcryptjs";
export async function GET(req) {
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get("mobile");

  if (searchQuery) {
    const formattedSearchQuery = searchQuery.replace(/\D/g, "");
    const customers = await CustomerProfile.find({
      phone_number: { $regex: formattedSearchQuery, $options: "i" },
    })
      .populate({
        path: "orders",
        model: Order,
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ customers }, { status: 200 });
  }

  try {
    const customers = await CustomerProfile.find().populate({
      path: "orders",
      model: Order,
    });
    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectMongo();
    const data = await req.json();

    // Check if the customer already exists
    const existingCustomer = await CustomerProfile.findOne({
      phone_number: data.phone,
    });

    if (existingCustomer) {
      // Update the existing customer
      existingCustomer.customer_name = data.name;

      if (data.password) {
        // Hash password only if it's provided
        existingCustomer.password = await bcrypt.hash(data.password, 10);
      }

      await existingCustomer.save();

      return NextResponse.json(
        {
          message: "Customer updated successfully.",
          customer: existingCustomer,
        },
        { status: 200 }
      );
    }

    // Create a new customer
    const customer = await CustomerProfile.create({
      customer_name: data.name,
      phone_number: data.phone,
      password: await bcrypt.hash(data.password, 10),
    });

    return NextResponse.json(
      { message: "Customer created successfully.", customer },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectMongo();

    const data = await req.json();
    const { customerId, currentPassword, newPassword } = data;

    // Input validation
    if (!customerId || !currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error:
            "All fields (customerId, currentPassword, newPassword) are required.",
        },
        { status: 400 }
      );
    }

    // Find the customer by ID
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    await customer.save();

    // Send success response
    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in password change handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}
