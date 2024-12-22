import connectMongo from "@/services/mongo";
import { Product } from "../models/product-model";
import { Stock } from "../models/stock-model";

export async function getProductById(productId) {
  await connectMongo();
  // Fetch the product details from the stock collection using the provided productId
  const product = await Stock.findOne({ product: productId })
    .populate({
      path: "product",
      model: Product,
    })
    .lean();
  return product;
}
