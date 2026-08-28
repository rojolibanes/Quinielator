import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/leagues', '/leaderboard', '/admin', '/profile'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  // Auth routes (redirect if already logged in)
  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some(path => pathname.startsWith(path));

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-'));

  // If no auth cookie exists and route is protected, redirect immediately without querying Supabase
  if (!hasAuthCookie && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If no auth cookie exists and on public/auth route, pass through immediately
  if (!hasAuthCookie) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Timeout safety for Edge Functions (max 2.5s) to avoid Vercel 504 MIDDLEWARE_INVOCATION_TIMEOUT
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500)
    );

    const userPromise = supabase.auth.getUser();
    const result = await Promise.race([userPromise, timeoutPromise]);
    const user = result?.data?.user ?? null;

    if (!user && isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  } catch (err) {
    console.warn('Middleware auth error:', err);
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
