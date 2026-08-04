import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerAccess } from "@/lib/partners";
import { partnerJoinOrigin, sendAthleteInvitation, type AthleteInvitationRow } from "@/lib/partner-athlete-invitations";

export async function POST(_request: Request, context: { params: Promise<{ organizationId: string; playerId: string }> }) {
  const { organizationId, playerId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin", "editor"]);
  if (!access) return NextResponse.json({ error: "Organization access was not found." }, { status: 404 });
  if (access.organization.status !== "active") return NextResponse.json({ error: "This partnership is not active." }, { status: 409 });

  const admin = createAdminClient();
  const [playerResult, invitationResult] = await Promise.all([
    admin.from("players").select("first_name,last_name").eq("id", playerId).eq("organization_id", organizationId).maybeSingle(),
    admin.from("partner_invitations").select("id,token,email,player_id,status,expires_at,last_sent_at,send_count,athlete_creation_mode").eq("player_id", playerId).eq("organization_id", organizationId).eq("role", "athlete").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (playerResult.error || invitationResult.error) return NextResponse.json({ error: playerResult.error?.message || invitationResult.error?.message }, { status: 500 });
  if (!playerResult.data || !invitationResult.data) return NextResponse.json({ error: "Athlete invitation was not found." }, { status: 404 });

  try {
    const result = await sendAthleteInvitation(invitationResult.data as AthleteInvitationRow, access.organization, `${playerResult.data.first_name} ${playerResult.data.last_name}`);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The invitation could not be sent." }, { status: 502 });
  }
}

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string; playerId: string }> }) {
  const { organizationId, playerId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin", "editor"]);
  if (!access) return NextResponse.json({ error: "Organization access was not found." }, { status: 404 });
  const result = await createAdminClient().from("partner_invitations").select("token").eq("player_id", playerId).eq("organization_id", organizationId).eq("role", "athlete").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: result.error?.message || "Invitation not found." }, { status: 404 });
  return NextResponse.json({ joinUrl: `${partnerJoinOrigin(access.organization)}/join/${result.data.token}` });
}
