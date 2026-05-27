import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const response = NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  response.cookies.delete("auth-token");
  return response;
}
