import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('db_manager_session');
  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/login', '/register'];
  const isPublic = publicPaths.includes(pathname);

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};