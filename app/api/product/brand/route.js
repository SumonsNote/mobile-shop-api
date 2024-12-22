import { Brand } from "@/app/models/brand-model";
import { Product } from "@/app/models/product-model";
import { cloudinary } from "@/lib/utils";
import { dbConnect } from "@/utils/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Connect to database
    await dbConnect();

    // Parse form data
    const formData = await req.formData();
    const title = formData.get("title");
    const category = formData.get("category");
    const status = formData.get("status");
    const file = formData.get("file");

    // Validate file
    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to Cloudinary
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(Buffer.from(fileBuffer));
    });

    // Check Cloudinary upload result
    if (!cloudinaryResponse?.secure_url) {
      return NextResponse.json(
        { message: "Failed to upload logo" },
        { status: 400 }
      );
    }

    // Create brand in database
    const brand = await Brand.create({
      logo: cloudinaryResponse.secure_url,
      title,
      category,
      status,
    });

    return NextResponse.json(
      { brand, message: "Successfully created brand" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in brand creation:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // get search parameters
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    console.log(category);
    await dbConnect();
    if (category) {
      const brands = await Brand.find({
        category: category.toLowerCase(),
      }).populate({
        path: "product_name",
        model: Product,
        select: "product_name",
      });
      return NextResponse.json({ brands }, { status: 200 });
    }

    const brands = await Brand.find().populate({
      path: "product_name",
      model: Product,
      select: "product_name",
    });
    return NextResponse.json({ brands }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const title = formData.get("title");
    const category = formData.get("category");
    const status = formData.get("status");
    const brandId = formData.get("id");

    if (!brandId) {
      return NextResponse.json(
        { message: "Brand ID is required" },
        { status: 400 }
      );
    }

    let secure_url = "";
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    // Check if the file is a Blob/File or a string
    if (typeof file === "object") {
      const fileBuffer = await file.arrayBuffer();

      // Upload file to Cloudinary
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto", // Automatically detect file type
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(Buffer.from(fileBuffer));
      });

      secure_url = uploadResponse?.secure_url;

      if (!secure_url) {
        return NextResponse.json(
          { message: "Failed to upload file to Cloudinary" },
          { status: 400 }
        );
      }
    } else {
      secure_url = file; // Assume it's a valid URL
    }

    // Prepare the update object
    const brandObj = {
      logo: secure_url,
      title,
      category,
      status,
    };

    // Update the brand in the database
    const brand = await Brand.findByIdAndUpdate(brandId, brandObj, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validations are run
    });

    if (!brand) {
      return NextResponse.json(
        { message: "Brand not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Successfully updated brand", brand },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { brandId } = await req.json();
    const brand = await Brand.findOneAndDelete({ _id: brandId });
    return NextResponse.json({ brand }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
