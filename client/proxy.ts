import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authCookieName = process.env.AUTH_COOKIE_NAME ?? "access_token";

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.has(authCookieName);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
