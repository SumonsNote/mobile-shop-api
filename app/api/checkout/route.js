import { Checkout } from "@/app/models/checkout-model";
import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectMongo();
    const checkouts = await Checkout.find();
    return NextResponse.json({ checkouts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
