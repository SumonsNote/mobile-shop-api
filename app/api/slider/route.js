import { NextResponse } from "next/server";
import connectMongo from "../../../services/mongo";
import { Slider } from "../../models/slider-model";

import { v2 as cloudinary } from "cloudinary";
import newProduct from "@/app/models/new-product-model";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    await connectMongo();

    const data = await req.formData();
    console.log(data);

    const title = data.get("title");
    const description = data.get("description");
    const regular_price = data.get("regular_price");
    const discount_price = data.get("discount_price");
    const productId = data.get("productId");
    const file = data.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required and must be a valid File object" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "sliders",
            allowed_formats: ["jpg", "png", "jpeg", "webp"],
          },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              resolve(
                NextResponse.json(
                  {
                    message: "Failed to upload image to Cloudinary",
                    error: error.message,
                  },
                  { status: 400 }
                )
              );
            } else {
              try {
                const sliderObj = {
                  image: result.secure_url,
                  title,
                  description,
                  regular_price,
                  discount_price,
                  productId,
                };

                const slider = await Slider.create(sliderObj);

                resolve(
                  NextResponse.json(
                    {
                      slider,
                      message: "Successfully created slider",
                      cloudinaryResponse: result,
                    },
                    { status: 201 }
                  )
                );
              } catch (dbError) {
                console.error("Database Error:", dbError);
                resolve(
                  NextResponse.json(
                    {
                      message: "Error saving slider to database",
                      error: dbError.message,
                    },
                    { status: 500 }
                  )
                );
              }
            }
          }
        )
        .end(buffer);
    });
  } catch (error) {
    console.error("Unexpected Error:", error);
    return NextResponse.json(
      { message: "Unexpected server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectMongo();

    const formData = await req.formData();
    const sliderId = formData.get("id");
    const title = formData.get("title");
    const description = formData.get("description");
    const regular_price = formData.get("regular_price");
    const discount_price = formData.get("discount_price");

    if (!sliderId) {
      return NextResponse.json(
        { message: "Slider ID is required" },
        { status: 400 }
      );
    }

    let secure_url = "";
    if (formData.has("file")) {
      const file = formData.get("file");

      if (typeof file !== "string") {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL_DEV}/api/cloudinary`,
          {
            method: "POST",
            body: uploadFormData,
          }
        );

        const responseBody = await response.json();

        if (response.ok) {
          secure_url = responseBody.secure_url;
        } else {
          return NextResponse.json(
            { message: "Failed to upload image to Cloudinary" },
            { status: 400 }
          );
        }
      } else {
        secure_url = file;
      }
    }

    if (secure_url) {
      const sliderObj = {
        image: secure_url,
        title,
        description,
        regular_price,
        discount_price,
      };

      const slider = await Slider.findByIdAndUpdate(sliderId, sliderObj);
      return NextResponse.json(
        { message: "Successfully created slider", slider },
        { status: 201 }
      );
    }

    if (!slider) {
      return NextResponse.json(
        { message: "Slider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { slider, message: "Successfully updated slider" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  await connectMongo();
  try {
    const slider = await Slider.find().populate({
      path: "productId",
      model: newProduct,
      select: "name model",
    });
    return NextResponse.json({ slider }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectMongo();
    const { sliderId } = await req.json();
    console.log(sliderId);
    const slider = await Slider.findByIdAndDelete(sliderId);
    return NextResponse.json({ slider }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
