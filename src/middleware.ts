import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('focus_session');
  let user = null;
  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (e) {
      user = null;
    }
  }

  const isLoginPath = request.nextUrl.pathname.startsWith('/login');

  if (!user && !isLoginPath) {
    // No user session, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  } else if (user && isLoginPath) {
    // User is logged in, redirect to root (which redirects to /dashboard)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}