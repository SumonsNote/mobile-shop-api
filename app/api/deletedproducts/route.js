import newProduct from "@/app/models/new-product-model";
import connectMongo from "@/services/mongo";

export async function GET(req) {
  await connectMongo();
  try {
    const products = await newProduct
      .find({ status: "deleted" })
      .sort({ createdAt: -1 });
    return new Response(
      JSON.stringify({
        success: true,
        length: products.length,
        products: products,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
