import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { playerToRow, rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import type { Player } from "@/lib/types";

function slugify(player: Partial<Player>) {
  return [player.firstName, player.lastName]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "player";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data ? rowToPlayer(data as PlayerRow) : null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const draft = await request.json() as Partial<Player>;
  const { data: existing, error: lookupError } = await supabase
    .from("players")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  const row = {
    ...playerToRow(draft),
    slug: existing?.slug || slugify(draft),
    user_id: user.id,
  };

  const query = existing
    ? supabase.from("players").update(row).eq("user_id", user.id)
    : supabase.from("players").insert(row);

  const { data, error } = await query.select("*").single();
  if (error) {
    const message = error.code === "23505"
      ? "That portfolio address is already in use. Add a middle initial or number to the player name."
      : error.message;
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ player: rowToPlayer(data as PlayerRow) });
}
