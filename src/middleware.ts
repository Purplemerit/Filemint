import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const publicPaths = ["/", "/login", "/signup", "/about", "/blogs", "/404"];
  const { pathname } = req.nextUrl;

  // If it's a public page, allow
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow /admin to pass through (will be protected client-side)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // For other protected routes, just continue
  // Your AuthContext handles the actual authentication
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Apply to all routes except static files & api
export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico).*)"],
};