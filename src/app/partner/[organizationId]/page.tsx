import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimPartnerInvitations, partnerAccess } from "@/lib/partners";
import { refreshPartnerStripeAccountStatus } from "@/lib/stripe-connect";
import { ensurePartnerDefaultPricing } from "@/lib/partner-pricing";
import PartnerDashboardClient from "@/components/partner/PartnerDashboardClient";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/partner/${organizationId}`)}`);
  await claimPartnerInvitations(user);
  const access = await partnerAccess(user.id, organizationId);
  if (!access) notFound();
  let stripeStatus = null;
  let pricingSetupError: string | null = null;
  if (access.organization.stripe_account_id) {
    try {
      stripeStatus = await refreshPartnerStripeAccountStatus(organizationId, access.organization.stripe_account_id);
    } catch (error) {
      console.error("Could not refresh the partner Stripe Account status", error);
    }
  }
  const organization = stripeStatus
    ? { ...access.organization, stripe_account_status: stripeStatus.status }
    : access.organization;
  if (organization.stripe_account_status === "active") {
    try {
      await ensurePartnerDefaultPricing(organization);
    } catch (error) {
      pricingSetupError = error instanceof Error ? error.message : "Default Stripe pricing could not be created.";
      console.error("Could not provision the partner Stripe catalog", error);
    }
  }
  const admin = createAdminClient();
  const [athletes, links, members] = await Promise.all([
    admin.from("players").select("id, first_name, last_name, invited_email, slug, partner_plan, partner_billing_source, partner_billing_status, partner_creation_mode, partner_payment_link_id, billing_tier, is_published, has_custom_domain, custom_domain, custom_domain_status, updated_at, partner_profile_checkouts(token, active), partner_invitations(token,status,last_sent_at,athlete_creation_mode)").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    admin.from("partner_payment_links").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    admin.from("partner_memberships").select("id, user_id, role, status").eq("organization_id", organizationId).order("created_at"),
  ]);
  return <PartnerDashboardClient organization={organization} stripeStatus={stripeStatus} role={access.membership.role} athletes={athletes.data ?? []} paymentLinks={links.data ?? []} memberCount={members.data?.length ?? 0} pricingSetupError={pricingSetupError} />;
}
