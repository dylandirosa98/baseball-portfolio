import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizedPlayer } from "@/lib/partners";
import { quotaError, type BillingTier } from "@/lib/billing";
import { normalizeProfileSlug, profileSlugError } from "@/lib/slug";
import { validatePlayerDraft } from "@/lib/player-validation";
import { playerToRow, rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import type { Player } from "@/lib/types";

function slugify(player: Partial<Player>) {
  return normalizeProfileSlug([player.firstName, player.lastName].filter(Boolean).join("-")) || "player";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const playerId = request.nextUrl.searchParams.get("playerId");
  const access = await authorizedPlayer(user.id, playerId, false);
  const data = access?.player ?? null;
  return NextResponse.json({
    player: data ? rowToPlayer(data as PlayerRow) : null,
    userId: user.id,
    managed: Boolean(access?.managed),
    organization: access?.managed ? access.organization : null,
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
  const playerId = request.nextUrl.searchParams.get("playerId");
  const access = await authorizedPlayer(user.id, playerId, true);
  const existing = access?.player ?? null;
  if (playerId && !access) return NextResponse.json({ error: "Managed athlete access was not found." }, { status: 404 });

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
  };

  const query = existing
    ? createAdminClient().from("players").update(row).eq("id", existing.id)
    : supabase.from("players").insert({ ...row, user_id: user.id });

  const { data, error } = await query.select("*").single();
  if (error) {
    const message = error.code === "23505"
      ? "That Diamond Profile address was just taken. Choose another."
      : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ player: rowToPlayer(data as PlayerRow) });
}
