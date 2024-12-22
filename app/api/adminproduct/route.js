import newProduct from "@/app/models/new-product-model";
import connectMongo from "@/services/mongo";

export async function POST(req) {
  await connectMongo();
  const body = await req.json();
  console.log(body);
  try {
    const product = await newProduct.create(body);
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

export async function PUT(req) {
  await connectMongo();
  const body = await req.json();
  console.log(body);
  try {
    const product = await newProduct.findByIdAndUpdate(body._id, body, {
      new: true,
    });
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
export async function GET(req) {
  await connectMongo();
  try {
    const products = await newProduct
      .find({ status: { $ne: "deleted" } })
      .sort({ createdAt: -1 });
    return new Response(JSON.stringify({ success: true, products: products }), {
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
