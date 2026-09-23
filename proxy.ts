import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PREVIEW_TOKEN_PATTERN = /^[0-9a-f]{16}$/;

/**
 * Guards /admin/* server-side on every request (§30.2: "never a client-side
 * redirect alone"). Also refreshes the Supabase session cookie so Server
 * Components see a valid session.
 *
 * On /s/[shopSlug], resolves the effective preview token (multi-shop spec
 * §5.3) — from `?preview=` if present, else the 7-day cookie from an earlier
 * visit — and forwards it as an `x-kg-preview-token` request header.
 * Layouts don't receive `searchParams` at all (only `page.tsx` does — the
 * shop layout needs the token too, to gate its own notFound() check and
 * render the preview banner/sticky bar), so a request header set here is
 * the one thing every Server Component in the tree can read for this same
 * request via next/headers — a `Set-Cookie` on the response can't: it only
 * reaches the browser and back on the *next* request, which is exactly the
 * chicken-and-egg case of the very first click on an agent's preview link.
 * The token is only ever format-checked here; whether it actually matches
 * the shop's stored preview_token is validated where it matters, in
 * lib/shops.ts#getShopForRoute (which has DB access this edge function
 * intentionally avoids on every request).
 */
export async function proxy(request: NextRequest) {
  const shopMatch = request.nextUrl.pathname.match(/^\/s\/([^/]+)/);
  if (shopMatch) {
    const queryToken = request.nextUrl.searchParams.get("preview");
    const queryTokenValid = queryToken && PREVIEW_TOKEN_PATTERN.test(queryToken);
    const cookieToken = request.cookies.get(`kg_preview_${shopMatch[1]}`)?.value;
    const effectiveToken = queryTokenValid ? queryToken : cookieToken;

    if (effectiveToken && PREVIEW_TOKEN_PATTERN.test(effectiveToken)) {
      request.headers.set("x-kg-preview-token", effectiveToken);
    }

    const response = NextResponse.next({ request });
    if (queryTokenValid) {
      response.cookies.set(`kg_preview_${shopMatch[1]}`, queryToken, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  }

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
  matcher: ["/admin/:path*", "/api/admin/:path*", "/s/:path*"],
};
