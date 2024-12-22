import { CustomerProfile } from "@/app/models/customer-profile-model";
import { ProductReview } from "@/app/models/product-review-model";
import { dbConnect } from "@/utils/mongo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const productReview = await ProductReview.create(data);
    return NextResponse.json({ status: "success", data: productReview });
  } catch (error) {
    return NextResponse.json({ status: "fail", data: error.message });
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const productReview = await ProductReview.find({});

    return NextResponse.json({ status: 201, productReview });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
