import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();
  const whiteLabelDomain = hostname.match(/^(?:admin|builder)\.(.+\..+)$/)?.[1];
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    whiteLabelDomain ? { cookieOptions: { domain: `.${whiteLabelDomain}`, path: "/", sameSite: "lax" } } : undefined,
  );
}
