import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Guards /admin/* server-side on every request (§30.2: "never a client-side
 * redirect alone"). Also refreshes the Supabase session cookie so Server
 * Components see a valid session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isAdminPageRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminApiRoute && !user) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Sign in required" } }, { status: 401 });
  }

  if (isAdminPageRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
