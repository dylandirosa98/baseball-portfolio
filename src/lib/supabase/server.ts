import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const hostname = headerStore.get("x-forwarded-host")?.split(":")[0].toLowerCase()
    || headerStore.get("host")?.split(":")[0].toLowerCase()
    || "";
  const whiteLabelDomain = hostname.match(/^(?:admin|builder)\.(.+\..+)$/)?.[1];

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(whiteLabelDomain ? { cookieOptions: { domain: `.${whiteLabelDomain}`, path: "/", sameSite: "lax" as const } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
