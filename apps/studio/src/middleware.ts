import { STUDIO_APP_HOSTS, publicEnv } from "@/lib/env";
import { isAppHost } from "@/lib/hosts";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Two jobs:
 *  1. Custom domains (M4.8): if the incoming Host is a client's custom domain (not
 *     an app host), rewrite EVERY path to /hosted, which renders only that client's
 *     published public site. A client's domain never exposes the agency app.
 *  2. Otherwise refreshes the Supabase auth session so Server Components always see
 *     a valid token. Keep matcher tight to avoid running on static assets.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  // A custom client domain → render its public site only. The guard on /hosted
  // avoids re-rewriting the internal target (rewrite preserves the browser URL).
  if (!isAppHost(host, STUDIO_APP_HOSTS) && !pathname.startsWith("/hosted")) {
    return NextResponse.rewrite(new URL("/hosted", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
