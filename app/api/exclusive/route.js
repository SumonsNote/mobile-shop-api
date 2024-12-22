import { NextResponse } from "next/server";
import connectMongo from "../../../services/mongo";
import { ExclusiveOffer } from "../../models/exclusive-offer-model";

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

    const label = data.get("label");
    const title = data.get("title");
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
            folder: "exclusives",
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
                const exclusiveObj = {
                  image: result.secure_url,
                  label,
                  title,
                  productId,
                };

                const exclusive = await ExclusiveOffer.create(exclusiveObj);

                resolve(
                  NextResponse.json(
                    {
                      exclusive,
                      message: "Successfully created exclusive",
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
                      message: "Error saving exclusive to database",
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

    const exclusiveId = formData.get("id");
    const label = formData.get("label");
    const title = formData.get("title");

    if (!exclusiveId) {
      return NextResponse.json(
        { message: "exclusive ID is required" },
        { status: 400 }
      );
    }

    let secure_url = "";
    if (formData.has("file")) {
      const file = formData.get("file");

      if (typeof file !== "string") {
        console.log("file");
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
      const exclusiveObj = {
        image: secure_url,
        label,
        title,
      };

      const exclusive = await ExclusiveOffer.findByIdAndUpdate(
        exclusiveId,
        exclusiveObj
      );
      return NextResponse.json(
        { message: "Successfully updated exclusive", exclusive },
        { status: 201 }
      );
    }

    if (!exclusive) {
      return NextResponse.json(
        { message: "exclusive not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req, res) {
  await connectMongo();
  try {
    const exclusive = await ExclusiveOffer.find().populate({
      path: "productId",
      model: newProduct,
      select: "name model",
    });
    return NextResponse.json({ exclusive }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectMongo();
    const { id } = await req.json();
    const exclusive = await ExclusiveOffer.findByIdAndDelete(id);
    return NextResponse.json({ exclusive }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
