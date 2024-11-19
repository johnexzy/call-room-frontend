import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // List of public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register"];
  const isPublicPath = publicPaths.some((path) => 
    request.nextUrl.pathname === path
  );

  const token = request.cookies.get("token")?.value;

  // If no token and trying to access protected route
  if (!token && !isPublicPath) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token"); // Clear any invalid tokens
    return response;
  }

  // If token exists and trying to access auth pages
  if (token && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Specify which paths should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 