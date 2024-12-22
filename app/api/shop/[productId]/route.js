import newProduct from "@/app/models/new-product-model";
import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectMongo();
    const productId = (await params).productId;
    const product = await newProduct.findById(productId).select({ purchase_price: 0 });
    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
