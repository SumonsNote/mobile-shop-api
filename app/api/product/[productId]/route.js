import newProduct from "@/app/models/new-product-model";
import connectMongo from "@/services/mongo";

export async function GET(req, { params }) {
  const id = (await params).productId;
  await connectMongo();
  try {
    const product = await newProduct.findById(id).select({ purchase_price: 0 });
    return new Response(JSON.stringify({ success: true, product: product }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
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

export async function DELETE(req, { params }) {
  const id = (await params).productId;
  await connectMongo();

  try {
    const product = await newProduct.findByIdAndUpdate(id, {
      status: "deleted",
    });
    return new Response(JSON.stringify({ success: true, product }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
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
