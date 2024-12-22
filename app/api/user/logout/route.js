import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const cookieStore = cookies();
    cookieStore.delete("token");
    return NextResponse.json({ status: "success", message: "Logout Success" });
  } catch (error) {
    return NextResponse.json({ status: "fail", data: error.message });
  }
}
