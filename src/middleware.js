import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
const PUBLIC_PAGES = [...AUTH_PAGES];

/**
 * Route protection at the edge: unauthenticated users are redirected to
 * /login (with callbackUrl); authenticated users are kept out of auth pages.
 * Fine-grained RBAC happens client-side via <RoleGate /> and navForRole().
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const isPublic = PUBLIC_PAGES.some((page) => pathname.startsWith(page));

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", request.url));
  }

  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (token && AUTH_PAGES.some((page) => pathname.startsWith(page))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes and static assets. API routes handle their
  // own auth and must never be redirected to the HTML login page.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
