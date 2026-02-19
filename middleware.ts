import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Get the auth token from cookies
    const authToken = request.cookies.get('authToken')?.value;
    const emailVerified = request.cookies.get('emailVerified')?.value;

    const { pathname } = request.nextUrl;

    // Define protected routes
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/assignments') || pathname.startsWith('/settings');
    const isAuthRoute = pathname.startsWith('/auth');
    const isVerifyRoute = pathname.startsWith('/verify-email');

    // If accessing protected route without auth token, redirect to auth
    if (isProtectedRoute && !authToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth';
        return NextResponse.redirect(url);
    }

    // If accessing protected route with unverified email, redirect to verification page
    if (isProtectedRoute && authToken && emailVerified === 'false') {
        const url = request.nextUrl.clone();
        url.pathname = '/verify-email';
        return NextResponse.redirect(url);
    }

    // If already authenticated and trying to access auth page, redirect to dashboard
    if (isAuthRoute && authToken && emailVerified === 'true') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // If verified but on verify-email, redirect to dashboard
    if (isVerifyRoute && authToken && emailVerified === 'true') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth',
    ],
};
