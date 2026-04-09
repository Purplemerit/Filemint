import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CORS_CONFIG } from "./app/config/constants";

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */
function addCorsHeaders(response: NextResponse, origin: string | null = null): NextResponse {
  const allowedOrigins = CORS_CONFIG.allowedOrigins;
  const isOriginAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', String(CORS_CONFIG.maxAge));
    
    if (CORS_CONFIG.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  return response;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const pathname = req.nextUrl.pathname;
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
  }

  const publicPaths = ["/", "/login", "/signup", "/about", "/blogs", "/404"];

  // If it's a public page, allow
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  // Allow /admin to pass through (will be protected client-side)
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  // For other protected routes, just continue
  // Your AuthContext handles the actual authentication
  const token = req.cookies.get("token")?.value;

  if (!token) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
}

// Apply to all routes except static files
export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};