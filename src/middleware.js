import { NextResponse } from 'next/server';

// Protected routes that should go through CrowdHandler queue
const PROTECTED_ROUTES = [
  '/book',
];

// Routes that should be ignored by CrowdHandler
const IGNORED_ROUTES = [
  '/_next',
  '/favicon.ico',
  '/api/auth',
  '/login',
  '/register',
  '/api/verify',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const url = request.url;
  
  // Skip CrowdHandler for ignored routes
  if (IGNORED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Only protect specific routes
  if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Detect and prevent redirect loops
  if (url.includes('%2F') || url.includes('https%3A') || url.length > 200) {
    console.warn('Redirect loop detected in middleware, allowing access');
    return NextResponse.next();
  }

  try {
    // For middleware, we'll use a simpler approach that doesn't rely on the full SDK
    // The client-side implementation will handle the full CrowdHandler integration
    
    // Check for existing CrowdHandler cookie
    const crowdhandlerCookie = request.cookies.get('crowdhandler');
    
    // If we have a cookie, assume user is promoted (client-side will validate)
    if (crowdhandlerCookie) {
      return NextResponse.next();
    }
    
    // For development, always allow access
    if (process.env.NODE_ENV === 'development') {
      console.log('CrowdHandler middleware: Development mode - allowing access');
      return NextResponse.next();
    }
    
    // In production without a cookie, let client-side handle validation
    // to avoid redirect loops in middleware
    const response = NextResponse.next();
    response.headers.set('x-crowdhandler-check-required', 'true');
    
    return response;

  } catch (error) {
    console.error('CrowdHandler middleware error:', error);
    
    // On error, allow access (trustOnFail behavior)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
