import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { quotaError, type BillingTier } from "@/lib/billing";
import { normalizeProfileSlug, profileSlugError } from "@/lib/slug";
import { validatePlayerDraft } from "@/lib/player-validation";
import { playerToRow, rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import type { Player } from "@/lib/types";

function slugify(player: Partial<Player>) {
  return normalizeProfileSlug([player.firstName, player.lastName].filter(Boolean).join("-")) || "player";
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
  return NextResponse.json({
    player: data ? rowToPlayer(data as PlayerRow) : null,
    userId: user.id,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let draft: Partial<Player>;
  try {
    draft = await request.json() as Partial<Player>;
  } catch {
    return NextResponse.json({ error: "Portfolio data was not valid JSON." }, { status: 400 });
  }
  const validationError = validatePlayerDraft(draft);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const { data: existing, error: lookupError } = await supabase
    .from("players")
    .select("id, slug, billing_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  const tier = (existing?.billing_tier || "free") as BillingTier;
  const limitError = quotaError(draft, tier);
  if (limitError) return NextResponse.json({ error: limitError }, { status: 403 });

  const requestedSlug = normalizeProfileSlug(draft.slug || "");
  const slug = requestedSlug && requestedSlug !== "preview"
    ? requestedSlug
    : existing?.slug || slugify(draft);
  const slugError = profileSlugError(slug);
  if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });

  const row = {
    ...playerToRow(draft),
    slug,
    user_id: user.id,
  };

  const query = existing
    ? supabase.from("players").update(row).eq("user_id", user.id)
    : supabase.from("players").insert(row);

  const { data, error } = await query.select("*").single();
  if (error) {
    const message = error.code === "23505"
      ? "That Diamond Profile address was just taken. Choose another."
      : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ player: rowToPlayer(data as PlayerRow) });
}
