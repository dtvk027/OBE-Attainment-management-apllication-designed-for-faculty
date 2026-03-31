import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Array of protected paths
  const protectedPaths = ['/dashboard', '/subject', '/admin'];
  
  const currentPath = request.nextUrl.pathname;
  
  // Check if current path starts with any of the protected paths
  const isProtected = protectedPaths.some(path => currentPath.startsWith(path));
  
  if (isProtected) {
    // Check for the token cookie
    const token = request.cookies.get('token')?.value;
    
    // If no token, redirect to login page
    if (!token) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // If it's a public path or user has a token, continue
  return NextResponse.next();
}

// Ensure the middleware runs on these paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/subject/:path*',
    '/admin/:path*'
  ],
};
