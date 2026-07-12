import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;
  const ownDomains = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
  const isOwnDomain =
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app") ||
    ownDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

  if (!isOwnDomain && pathname === "/" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { data: player } = await admin
      .from("players")
      .select("slug")
      .eq("custom_domain", hostname)
      .eq("is_published", true)
      .maybeSingle();

    if (player?.slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${player.slug}`;
      return NextResponse.rewrite(url);
    }
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith("/account") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (pathname === "/auth" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/builder";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/", "/auth", "/account/:path*", "/builder/:path*"],
};
