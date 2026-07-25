import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_DOMAIN, profileSlugError } from "@/lib/slug";

function normalizedHostname(value: string) {
  return value.toLowerCase().split(":")[0].replace(/\.$/, "");
}

function profileSlugFromHostname(hostname: string) {
  const normalized = normalizedHostname(hostname);
  const suffix = normalized.endsWith(".localhost") ? ".localhost" : `.${PROFILE_DOMAIN}`;
  if (!normalized.endsWith(suffix)) return null;

  const slug = normalized.slice(0, -suffix.length);
  if (!slug || slug.includes(".") || profileSlugError(slug)) return null;
  return slug;
}

function apexUrl(request: NextRequest, hostname: string) {
  if (hostname.endsWith(".localhost")) {
    const hostHeader = request.headers.get("host") || "";
    const port = hostHeader.split(":")[1] || request.nextUrl.port;
    return new URL(request.nextUrl.pathname + request.nextUrl.search, `http://localhost${port ? `:${port}` : ""}`);
  }
  return new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${PROFILE_DOMAIN}`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = normalizedHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.hostname
  );
  const profileSlug = profileSlugFromHostname(hostname);

  if (profileSlug) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${profileSlug}`;
      return NextResponse.rewrite(url);
    }

    if (pathname === `/${profileSlug}`) return NextResponse.next({ request });

    if (
      pathname === "/auth" ||
      pathname.startsWith("/account") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/builder") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/partner")
    ) {
      return NextResponse.redirect(apexUrl(request, hostname));
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const ownDomains = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "")
    .split(",")
    .map((domain) => normalizedHostname(domain.trim().replace(/^https?:\/\//, "").split("/")[0]))
    .filter(Boolean);
  const isOwnDomain =
    hostname === "localhost" ||
    hostname.endsWith(".vercel.app") ||
    hostname === PROFILE_DOMAIN ||
    hostname === `www.${PROFILE_DOMAIN}` ||
    ownDomains.some((domain) => hostname === domain);

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
      .eq("has_custom_domain", true)
      .eq("custom_domain_status", "active")
      .eq("is_published", true)
      .maybeSingle();

    if (player?.slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${player.slug}`;
      return NextResponse.rewrite(url);
    }
  }

  const needsAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner");
  if (!needsAuth && pathname !== "/auth") return NextResponse.next({ request });

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

  if ((pathname.startsWith("/account") || pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/partner")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (pathname === "/auth" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
