import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { isAdminRole } from "./lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isAdmin = isAdminRole(session?.user?.role);

  const path = nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const needsAuth =
    path.startsWith("/cart") ||
    path.startsWith("/checkout") ||
    path.startsWith("/orders") ||
    isAdminRoute;

  if (needsAuth && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
