import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast check: look for Supabase auth cookie directly from request headers
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  const protectedPaths = ['/dashboard', '/leagues', '/leaderboard', '/admin', '/profile'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  // If user has no auth cookie and tries to access protected route, redirect to /login instantly
  if (!hasAuthCookie && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user already has auth cookie and tries to access login/register, redirect to /dashboard instantly
  if (hasAuthCookie && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({
    request,
  });
}
