import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";

import newProduct from "@/app/models/new-product-model";
import { transformProductData } from "@/utils/transformProductData";

export async function GET(req) {
  await connectMongo();
  try {
    // Fetch stocks and populate the product data
    const stocks = await newProduct
      .find(
        { status: { $ne: "deleted" } },
        "name images is_trending discount_price discount_price original_price stock brand model region storage ram warrantyStatus"
      )
      .sort({ createdAt: -1 });

    // Filter for best-seller products
    const filteredStocks = stocks.filter((stock) => stock.is_trending === true);

    // Transform the filtered data
    const transformedStocks = filteredStocks.map((stock) => {
      const stockData = stock.toObject();
      return transformProductData(stockData);
    });

    return NextResponse.json(
      { trending_products: transformedStocks },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
