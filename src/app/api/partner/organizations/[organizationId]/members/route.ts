import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { inviteOrFindUser, partnerAccess } from "@/lib/partners";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await partnerAccess(user.id, organizationId, ["owner", "admin"]) : null;
  if (!user || !access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const role = ["admin", "editor", "viewer"].includes(String(body.role)) ? String(body.role) : "editor";
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  try {
    const invited = await inviteOrFindUser(email, `${getAppUrl()}/auth/callback?next=${encodeURIComponent(`/partner/${organizationId}`)}`, {
      partner_organization_id: organizationId,
      partner_organization_name: access.organization.name,
      partner_role: role,
    });
    const admin = createAdminClient();
    const membership = await admin.from("partner_memberships").upsert({ organization_id: organizationId, user_id: invited.user.id, role, status: "active" }, { onConflict: "organization_id,user_id" });
    if (membership.error) throw membership.error;
    await admin.from("partner_invitations").insert({ organization_id: organizationId, email, role, invited_by: user.id, auth_user_id: invited.user.id, status: invited.invited ? "pending" : "accepted" });
    return NextResponse.json({ invited: invited.invited });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Team invitation failed." }, { status: 500 });
  }
}

