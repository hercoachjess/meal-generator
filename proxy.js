import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Check for Supabase session cookies (either format)
  const projectRef = "ownmulrkykbbcnytuozi";
  const hasSession =
    request.cookies.has(`sb-${projectRef}-auth-token`) ||
    request.cookies.has("sb-access-token") ||
    request.cookies.has(`sb-${projectRef}-auth-token.0`) ||
    request.cookies.has("supabase-auth-token");

  // Redirect logged-in users away from login page
  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/generator", request.url));
  }

  // Redirect unauthenticated users to login (protect app routes)
  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Public routes: landing page (/), login, static assets, preview-landing
  matcher: ["/((?!_next/static|_next/image|favicon.ico|preview-landing|$).+)"],
};
