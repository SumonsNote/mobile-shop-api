import { cloudinary } from "../../../lib/utils"; // your config path
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    console.log(formData);
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert the file to a buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload the file to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto", // automatically detect the resource type
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(Buffer.from(fileBuffer));
    });

    // Return the Cloudinary response
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
