import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const acceptedAdultTerms = request.nextUrl.searchParams.get("consent") === "adult";
  const requestedNext = request.nextUrl.searchParams.get("next") || "/builder";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/builder";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (acceptedAdultTerms && !data.user?.user_metadata?.terms_accepted_at) {
        await supabase.auth.updateUser({
          data: {
            adult_account_holder: true,
            terms_accepted_at: new Date().toISOString(),
          },
        });
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth?mode=signin&error=oauth", request.url));
}
