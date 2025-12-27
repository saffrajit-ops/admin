import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if accessing dashboard
  if (path.startsWith("/dashboard")) {
    // Get auth token from cookie or check if user is authenticated
    // Since we're using zustand with localStorage, we'll handle this on client side
    // This middleware is just for additional security
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
