import { NextResponse } from "next/server";
import connectMongo from "../../../services/mongo";
import { Countdown } from "../../models/countdown-model";

export async function PUT(req) {
  try {
    await connectMongo();

    const formData = await req.formData();

    const countdownId = formData.get("id");
    const label = formData.get("label");
    const title = formData.get("title");
    const description = formData.get("description");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const is_active = formData.get("is_active");

    if (!countdownId) {
      return NextResponse.json(
        { message: "Countdown ID is required" },
        { status: 400 }
      );
    }

    const countdownObj = {
      label,
      title,
      description,
      start_date,
      end_date,
      is_active: is_active === "true",
    };

    const countdown = await Countdown.findByIdAndUpdate(
      countdownId,
      countdownObj
    );

    if (!countdown) {
      return NextResponse.json(
        { message: "Countdown not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Successfully updated countdown", countdown },
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
    const countdown = await Countdown.find();
    return NextResponse.json({ countdown }, { status: 200 });
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
