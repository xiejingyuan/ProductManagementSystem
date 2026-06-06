import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/products", "/account"];
const PUBLIC_ONLY = ["/login", "/register"];
const SKIP_AUTH_HEADER = ["/api/set-auth-cookie", "/api/clear-auth-cookie", "/api/auth-expired"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", request.url)
    );
  }

  if (token && PUBLIC_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/") &&
    !SKIP_AUTH_HEADER.some((r) => pathname.startsWith(r)) &&
    token
  ) {
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
