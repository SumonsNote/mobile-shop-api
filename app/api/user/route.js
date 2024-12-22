import { User } from "@/app/models/user-model";
import connectMongo from "@/services/mongo";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongo();
    const formData = await req.formData();
    console.log(formData);

    const firstName = formData.get("first_name");
    const lastName = formData.get("last_name");
    const email = formData.get("email");
    const username = formData.get("username");
    const phone = formData.get("phone");
    const password = formData.get("password");
    const status = formData.get("status");
    const role = formData.get("role");

    // Validate required fields
    if (!firstName || !lastName || !email || !status || !role) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      username,
      phone,
      password: hashedPassword,
      status,
      role,
    });

    return NextResponse.json(
      { user, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectMongo();

    const user = await User.find({});

    return NextResponse.json({ status: "success", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { status: "fail", error: error.message },
      { status: 500 }
    );
  }
}
