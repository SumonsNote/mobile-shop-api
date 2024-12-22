"use server";
import { signIn, signOut } from "@/auth";
import { deleteSession } from "@/lib/session";
import connectMongo from "@/services/mongo";
import { redirect } from "next/navigation";

export async function login(formData) {
  try {
    await connectMongo();
    const response = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function logout() {
  signOut();
  deleteSession();
  redirect("/admin-login");
}
