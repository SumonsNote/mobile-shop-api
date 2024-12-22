import { Category } from "@/app/models/category-model";
import { cloudinary } from "@/lib/utils";
import connectMongo from "@/services/mongo";
import { dbConnect } from "@/utils/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const categoryName = formData.get("title");
    const file = formData.get("file"); // Extract the file (Blob)

    if (!categoryName) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer for Cloudinary upload
    const fileBuffer = await file.arrayBuffer();

    // Upload the file to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto", // Automatically detect the resource type
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(Buffer.from(fileBuffer));
    });

    const secure_url = uploadResult?.secure_url;

    if (!secure_url) {
      return NextResponse.json(
        { message: "Failed to upload logo to Cloudinary" },
        { status: 400 }
      );
    }

    // Prepare category object for the database
    const categoryObj = {
      categoryImg: secure_url,
      categoryName,
    };

    // Save the category to the database
    const category = await Category.create(categoryObj);

    return NextResponse.json(
      { category, message: "Successfully created category" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const categoryName = formData.get("title");
    const categoryId = formData.get("id");
    const file = formData.get("file"); // Extract the file (Blob)

    if (!categoryName) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    let secure_url = "";

    // Check if the file is a Blob/File (not a string URL)
    if (typeof file !== "string") {
      const fileBuffer = await file.arrayBuffer();

      // Upload the file to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto", // Automatically detect the resource type
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(Buffer.from(fileBuffer));
      });

      secure_url = uploadResult?.secure_url;

      if (!secure_url) {
        return NextResponse.json(
          { message: "Failed to upload image to Cloudinary" },
          { status: 400 }
        );
      }
    } else {
      secure_url = file; // Use the provided URL if the file is a string
    }

    // Prepare category object for update
    const categoryObj = {
      categoryImg: secure_url,
      categoryName,
    };

    // Update the category in the database
    const category = await Category.findByIdAndUpdate(
      categoryId,
      categoryObj,
      { new: true } // Return the updated document
    );

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Successfully updated category", category },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  await connectMongo();
  try {
    const categories = await Category.find();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
