import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAthleteInvitation, type AthleteInvitationRow } from "@/lib/partner-athlete-invitations";
import type { PartnerOrganizationRow } from "@/lib/partners";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const admin = createAdminClient();
  const result = await admin.from("partner_invitations")
    .select("id,token,email,player_id,status,expires_at,last_sent_at,send_count,athlete_creation_mode,players(first_name,last_name),partner_organizations(*)")
    .eq("token", token).eq("role", "athlete").maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: "This invitation is invalid." }, { status: 404 });
  const row = result.data as unknown as AthleteInvitationRow & {
    players: { first_name: string; last_name: string } | null;
    partner_organizations: PartnerOrganizationRow | null;
  };
  if (!row.players || !row.partner_organizations) return NextResponse.json({ error: "This invitation is unavailable." }, { status: 409 });
  if (row.partner_organizations.status !== "active") return NextResponse.json({ error: "This organization is not currently accepting athlete invitations." }, { status: 409 });
  if (row.last_sent_at && Date.now() - new Date(row.last_sent_at).getTime() < 60_000) {
    return NextResponse.json({ error: "A secure link was just sent. Please check the athlete's inbox." }, { status: 429 });
  }
  try {
    await sendAthleteInvitation(row, row.partner_organizations, `${row.players.first_name} ${row.players.last_name}`);
    return NextResponse.json({ sent: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "A secure link could not be sent." }, { status: 502 });
  }
}
