import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { partnerAdminHostname } from "@/lib/domain-name";
import { generatePartnerAthleteAccessLink, type PartnerOrganizationRow } from "@/lib/partners";
import { sendPartnerAthleteEmail } from "@/lib/partner-athlete-email";

export type AthleteInvitationRow = {
  id: string;
  token: string;
  email: string;
  player_id: string;
  status: string;
  expires_at: string;
  last_sent_at: string | null;
  send_count: number;
  athlete_creation_mode: "athlete_builds" | "organization_builds";
};

export function partnerJoinOrigin(organization: PartnerOrganizationRow) {
  if (organization.partnership_type === "white_label" && organization.profile_domain && organization.profile_domain_status === "active") {
    return `https://${partnerAdminHostname(organization.profile_domain)}`;
  }
  return getAppUrl();
}

export async function sendAthleteInvitation(
  invitation: AthleteInvitationRow,
  organization: PartnerOrganizationRow,
  athleteName: string,
) {
  if (invitation.status === "revoked" || invitation.status === "expired") throw new Error("This invitation is no longer active.");
  const origin = partnerJoinOrigin(organization);
  const joinPath = `/join/${invitation.token}`;
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(joinPath)}`;
  const generated = await generatePartnerAthleteAccessLink(invitation.email, callback, {
    partner_organization_id: organization.id,
    partner_organization_name: organization.name,
    partner_role: "athlete",
    partner_player_id: invitation.player_id,
  });
  await sendPartnerAthleteEmail({
    to: invitation.email,
    athleteName,
    actionLink: generated.actionLink,
    organization,
    creationMode: invitation.athlete_creation_mode,
  });
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("partner_invitations").update({
    auth_user_id: generated.user.id,
    last_sent_at: now,
    send_count: invitation.send_count + 1,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq("id", invitation.id);
  if (error) throw error;
  return { joinUrl: `${origin}${joinPath}`, sentAt: now };
}
