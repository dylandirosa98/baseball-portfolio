import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { normalizeProfileSlug, profileSlugError } from "@/lib/slug";
import { partnerBuilderHostname } from "@/lib/domain-name";
import { inviteOrFindUser, partnerAccess } from "@/lib/partners";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";

function emailAddress(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

async function uniqueSlug(firstName: string, lastName: string) {
  const admin = createAdminClient();
  const base = normalizeProfileSlug(`${firstName}-${lastName}`) || "player";
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const slug = suffix ? `${base}-${suffix + 1}` : base;
    if (profileSlugError(slug)) continue;
    const { data, error } = await admin.from("players").select("id").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin", "editor"]);
  if (!access) return NextResponse.json({ error: "Organization access was not found." }, { status: 404 });
  if (access.organization.status !== "active") return NextResponse.json({ error: "This partnership is not active." }, { status: 409 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const firstName = String(body.firstName || "").trim().slice(0, 80);
  const lastName = String(body.lastName || "").trim().slice(0, 80);
  const email = emailAddress(body.email);
  const plan = body.plan === "elite" ? "elite" : "pro";
  const billingSource = body.billingSource === "partner_paid" ? "partner_paid" : "customer_subscription";
  const paymentLinkId = String(body.paymentLinkId || "");
  if (!firstName || !lastName || !email) return NextResponse.json({ error: "First name, last name, and a valid email are required." }, { status: 400 });
  if (!access.organization.billing_payment_method_ready) {
    return NextResponse.json({ error: "Add the organization billing card before creating paid athlete profiles." }, { status: 409 });
  }

  const admin = createAdminClient();
  let paymentLink: { id: string; tier: string } | null = null;
  if (billingSource === "customer_subscription") {
    const result = await admin.from("partner_payment_links").select("id, tier").eq("id", paymentLinkId).eq("organization_id", organizationId).eq("active", true).maybeSingle();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    paymentLink = result.data;
    if (!paymentLink || paymentLink.tier !== plan) return NextResponse.json({ error: `Select a verified ${plan} payment link.` }, { status: 400 });
  }

  let createdPlayerId: string | null = null;
  try {
    const invited = await inviteOrFindUser(
      email,
      `${access.organization.profile_domain && access.organization.profile_domain_status === "active" ? `https://${partnerBuilderHostname(access.organization.profile_domain)}` : getAppUrl()}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      { partner_organization_id: organizationId, partner_organization_name: access.organization.name, partner_role: "athlete" },
    );
    const owned = await admin.from("players").select("id").eq("user_id", invited.user.id).maybeSingle();
    if (owned.error) throw owned.error;
    if (owned.data) return NextResponse.json({ error: "That account already owns a Diamond Profile." }, { status: 409 });

    const slug = await uniqueSlug(firstName, lastName);
    const active = billingSource === "partner_paid";
    const inserted = await admin.from("players").insert({
      user_id: invited.user.id,
      organization_id: organizationId,
      invited_email: email,
      slug,
      first_name: firstName,
      last_name: lastName,
      position: String(body.position || "Baseball Player").trim().slice(0, 80),
      team: String(body.team || "").trim().slice(0, 120),
      partner_plan: plan,
      partner_billing_source: billingSource,
      partner_billing_status: active ? "active" : "pending",
      partner_payment_link_id: paymentLink?.id || null,
      billing_tier: active ? plan : "free",
      subscription_status: active ? "active" : "inactive",
      is_published: false,
    }).select("*").single();
    if (inserted.error) throw inserted.error;
    createdPlayerId = inserted.data.id;

    await admin.from("partner_invitations").insert({
      organization_id: organizationId,
      email,
      role: "athlete",
      player_id: inserted.data.id,
      invited_by: user.id,
      auth_user_id: invited.user.id,
      status: invited.invited ? "pending" : "accepted",
    });

    let checkoutUrl: string | null = null;
    if (paymentLink) {
      const checkout = await admin.from("partner_profile_checkouts").insert({
        organization_id: organizationId,
        player_id: inserted.data.id,
        payment_link_id: paymentLink.id,
      }).select("token").single();
      if (checkout.error) throw checkout.error;
      checkoutUrl = `${getAppUrl()}/p/${checkout.data.token}`;
    }
    if (active) await syncPartnerWholesaleBilling(organizationId);
    return NextResponse.json({ athlete: inserted.data, checkoutUrl, invited: invited.invited });
  } catch (error) {
    if (createdPlayerId && billingSource === "partner_paid") {
      await admin.from("players").update({ partner_billing_status: "pending", billing_tier: "free", subscription_status: "inactive", is_published: false }).eq("id", createdPlayerId);
    }
    const message = error instanceof Error ? error.message : "Athlete creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
