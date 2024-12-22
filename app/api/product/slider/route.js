import { ProductSlider } from "@/app/models/product-slider-model";
import { dbConnect } from "@/utils/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const sliderObj = await req.json();

    const slider = await ProductSlider.create(sliderObj);
    return NextResponse.json(
      { slider, message: "Successfully created slider" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const sliders = await ProductSlider.find();

    return NextResponse.json({ sliders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
