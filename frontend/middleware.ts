import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = process.env.NEXT_PUBLIC_PUBLIC_PATHS
  ? JSON.parse(process.env.NEXT_PUBLIC_PUBLIC_PATHS)
  : ['/', '/login', '/register', '/_next', '/favicon.ico'];
const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'access_token';

function decodeJwtPayload(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_KEY)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|avif)).*)'],
};
