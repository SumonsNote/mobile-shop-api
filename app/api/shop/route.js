import connectMongo from "@/services/mongo";
import { NextResponse } from "next/server";
import newProduct from "@/app/models/new-product-model";
import { transformProductData } from "@/utils/transformProductData";

export async function GET(req) {
  await connectMongo();
  try {
    const { searchParams } = new URL(req.url);

    const searchQuery = searchParams.get("search");

    let query = { status: { $ne: "deleted" } }; // Initial query condition
    if (searchQuery) {
      query = {
        $and: [
          { status: { $ne: "deleted" } }, // Preserve initial condition
          {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { brand: { $regex: searchQuery, $options: "i" } },
              { model: { $regex: searchQuery, $options: "i" } },
            ],
          },
        ],
      };
    }

    const stocks = await newProduct.find(
      query,
      "name images discount_price original_price color stock brand model region storage ram warrantyStatus"
    );

    const transformedStocks = stocks.map((stock) => {
      const stockData = stock.toObject();
      return transformProductData(stockData);
    });

    return NextResponse.json({ products: transformedStocks }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
