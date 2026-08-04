import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { getAppUrl } from "@/lib/stripe";
import { cancelPartnerOrganization, inviteOrFindUser } from "@/lib/partners";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";
import { createPartnerStripeAccount } from "@/lib/stripe-connect";

function organizationSlug(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function adminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && isPlatformAdmin(user.email) ? user : null;
}

export async function GET() {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createAdminClient();
  const { data: organizations, error } = await admin
    .from("partner_organizations")
    .select("*, partner_memberships(id, user_id, role, status), players(id, partner_plan, partner_billing_status, is_published, has_custom_domain)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ organizations });
}

export async function POST(request: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name = String(body.name || "").trim().slice(0, 120);
  const slug = organizationSlug(body.slug || name);
  const ownerEmail = String(body.ownerEmail || "").trim().toLowerCase();
  const partnershipType = body.partnershipType === "white_label" ? "white_label" : "partner";
  if (!name || slug.length < 3 || !/^\S+@\S+\.\S+$/.test(ownerEmail)) {
    return NextResponse.json({ error: "Organization name, URL slug, and owner email are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: organization, error: organizationError } = await admin.from("partner_organizations").insert({
    name,
    slug,
    partnership_type: partnershipType,
    status: partnershipType === "white_label" ? "draft" : "active",
    billing_email: ownerEmail,
    support_email: ownerEmail,
    pro_wholesale_cents: partnershipType === "white_label" ? 400 : 800,
    elite_wholesale_cents: partnershipType === "white_label" ? 600 : 1200,
    domain_wholesale_cents: 1000,
    white_label_monthly_cents: 20000,
    wholesale_billing_exempt: false,
    wholesale_billing_exempt_reason: null,
    hide_diamond_branding: partnershipType === "white_label",
    created_by: user.id,
  }).select("*").single();
  if (organizationError) {
    return NextResponse.json({ error: organizationError.code === "23505" ? "That organization slug is already in use." : organizationError.message }, { status: organizationError.code === "23505" ? 409 : 500 });
  }

  try {
    const stripeAccount = await createPartnerStripeAccount({
      organizationId: organization.id,
      displayName: name,
      contactEmail: ownerEmail,
    });

    const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent(`/partner/${organization.id}`)}`;
    const invited = await inviteOrFindUser(ownerEmail, redirectTo, {
      partner_organization_id: organization.id,
      partner_organization_name: name,
      partner_role: "owner",
    });
    const { error: membershipError } = await admin.from("partner_memberships").insert({
      organization_id: organization.id,
      user_id: invited.user.id,
      role: "owner",
      status: "active",
    });
    if (membershipError) throw membershipError;
    await admin.from("partner_invitations").insert({
      organization_id: organization.id,
      email: ownerEmail,
      role: "owner",
      invited_by: user.id,
      auth_user_id: invited.user.id,
      status: invited.invited ? "pending" : "accepted",
    });
    return NextResponse.json({ organization: {
      ...organization,
      stripe_account_id: stripeAccount.account.id,
      stripe_account_status: stripeAccount.state.status,
    }, invited: invited.invited });
  } catch (setupError) {
    const message = setupError instanceof Error ? setupError.message : "Partner setup failed.";
    await admin.from("partner_organizations").update({ status: "draft", billing_sync_error: message.slice(0, 1000) }).eq("id", organization.id);
    return NextResponse.json({ error: message, organizationId: organization.id }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });
  const values: Record<string, unknown> = {};
  const requestedStatus = String(body.status || "");
  if (["draft", "active", "suspended", "canceled"].includes(requestedStatus)) values.status = requestedStatus;
  if (["partner", "white_label"].includes(String(body.partnershipType))) {
    const whiteLabel = body.partnershipType === "white_label";
    values.partnership_type = body.partnershipType;
    values.hide_diamond_branding = whiteLabel;
    values.pro_wholesale_cents = whiteLabel ? 400 : 800;
    values.elite_wholesale_cents = whiteLabel ? 600 : 1200;
    values.domain_wholesale_cents = 1000;
    if (!whiteLabel) {
      values.wholesale_billing_exempt = false;
      values.wholesale_billing_exempt_reason = null;
    }
  }
  if (typeof body.name === "string" && body.name.trim()) values.name = body.name.trim().slice(0, 120);
  const adminClient = createAdminClient();
  const { data: before, error: beforeError } = await adminClient
    .from("partner_organizations")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 500 });
  if (!before) return NextResponse.json({ error: "Partner was not found." }, { status: 404 });

  const { data, error } = await adminClient.from("partner_organizations").update(values).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Partner was not found." }, { status: 404 });
  let billingWarning: string | null = null;
  try {
    if (requestedStatus === "canceled") {
      await cancelPartnerOrganization(id);
    }
    await syncPartnerWholesaleBilling(id);
  } catch (syncError) {
    billingWarning = syncError instanceof Error ? syncError.message : "Wholesale billing synchronization failed.";
  }
  return NextResponse.json({ organization: data, billingWarning });
}
