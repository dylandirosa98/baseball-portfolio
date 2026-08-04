import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizedPlayer } from "@/lib/partners";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Create a free account to publish your portfolio." }, { status: 401 });

  const playerId = request.nextUrl.searchParams.get("playerId");
  const access = await authorizedPlayer(user.id, playerId, true);
  if (!access) return NextResponse.json({ error: "Save your player name before publishing." }, { status: 409 });
  if (access.managed && !["trialing", "active", "past_due", "canceling"].includes(access.player.partner_billing_status)) {
    return NextResponse.json({ error: "This athlete needs an active partner plan before publishing." }, { status: 402 });
  }
  const { data, error } = await createAdminClient()
    .from("players")
    .update({ is_published: true })
    .eq("id", access.player.id)
    .select("slug")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Save your player name before publishing." }, { status: 409 });

  return NextResponse.json({ published: true, slug: data.slug });
}
