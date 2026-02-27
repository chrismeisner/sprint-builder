import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Continue with the request and add security headers
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "x-pathname": request.nextUrl.pathname,
      }),
    },
  });

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Allow sandbox files to be framed (for the sandbox viewer)
  // Use SAMEORIGIN for sandbox paths, DENY for everything else
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/sandboxes/") && pathname.includes(".")) {
    // Static sandbox files (e.g., /sandboxes/demo/index.html) can be framed from same origin
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }
  
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Strict-Transport-Security (HSTS) - tells browsers to always use HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

