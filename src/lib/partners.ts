import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { disableManagedDomainRenewal } from "@/lib/vercel-domains";

export type PartnerRole = "owner" | "admin" | "editor" | "viewer";
export type PartnershipType = "partner" | "white_label";

export type PartnerOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  partnership_type: PartnershipType;
  status: "draft" | "active" | "suspended" | "canceled";
  billing_email: string | null;
  stripe_account_id: string | null;
  stripe_account_status: "not_connected" | "pending" | "active" | "restricted" | "disconnected";
  stripe_onboarding_complete: boolean;
  stripe_requirements_status: "currently_due" | "eventually_due" | "past_due" | null;
  stripe_status_checked_at: string | null;
  platform_stripe_customer_id: string | null;
  platform_stripe_subscription_id: string | null;
  platform_subscription_status: string;
  billing_payment_method_ready: boolean;
  platform_base_item_id: string | null;
  platform_pro_item_id: string | null;
  platform_elite_item_id: string | null;
  platform_domain_item_id: string | null;
  billing_sync_error: string | null;
  billing_synced_at: string | null;
  pro_wholesale_cents: number;
  elite_wholesale_cents: number;
  domain_wholesale_cents: number;
  white_label_monthly_cents: number;
  wholesale_billing_exempt: boolean;
  wholesale_billing_exempt_reason: string | null;
  logo_url: string | null;
  primary_color: string;
  support_email: string | null;
  profile_domain: string | null;
  profile_domain_status: "none" | "pending" | "active" | "failed";
  profile_domain_error: string | null;
  profile_domain_verification: Array<{ domain?: string; verified?: boolean; type?: string; name?: string; value?: string }>;
  profile_domain_verified_at: string | null;
  hide_diamond_branding: boolean;
  created_at: string;
  updated_at: string;
};

export async function partnerAccess(
  userId: string,
  organizationId: string,
  allowedRoles?: PartnerRole[],
) {
  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("partner_memberships")
    .select("id, role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  let platformAdministrator = false;
  if (!membership || (allowedRoles && !allowedRoles.includes(membership.role as PartnerRole))) {
    const result = await admin.auth.admin.getUserById(userId);
    if (result.error) throw result.error;
    platformAdministrator = isPlatformAdmin(result.data.user?.email);
    if (!platformAdministrator) return null;
  }

  const { data: organization, error: organizationError } = await admin
    .from("partner_organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  if (organizationError) throw organizationError;
  if (!organization || organization.status === "canceled") return null;
  return {
    membership: platformAdministrator
      ? { id: `platform-admin:${userId}`, role: "admin" as const, status: "active" }
      : { ...membership!, role: membership!.role as PartnerRole },
    organization: organization as PartnerOrganizationRow,
  };
}

export async function authorizedPlayer(userId: string, playerId?: string | null, write = false) {
  const admin = createAdminClient();
  const query = admin.from("players").select("*");
  const { data: player, error } = playerId
    ? await query.eq("id", playerId).maybeSingle()
    : await query.eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!player) return null;
  if (player.user_id === userId && !player.organization_id) return { player, managed: false, role: "athlete" as const };
  if (player.user_id === userId && player.organization_id) {
    const { data: organization, error: organizationError } = await admin.from("partner_organizations").select("*").eq("id", player.organization_id).maybeSingle();
    if (organizationError) throw organizationError;
    if (!organization || organization.status === "canceled") return null;
    return { player, managed: true, role: "athlete" as const, organization: organization as PartnerOrganizationRow };
  }
  if (!player.organization_id) return null;

  const access = await partnerAccess(
    userId,
    player.organization_id,
    write ? ["owner", "admin", "editor"] : undefined,
  );
  if (!access) return null;
  return { player, managed: true, role: access.membership.role, organization: access.organization };
}

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 100; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw result.error;
    const match = result.data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (result.data.users.length < 1000) break;
  }
  return null;
}

export async function inviteOrFindUser(email: string, redirectTo: string, metadata: Record<string, unknown>) {
  const admin = createAdminClient();
  const existing = await findAuthUserByEmail(email);
  if (existing) return { user: existing, invited: false };
  const result = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: metadata,
  });
  if (result.error) throw result.error;
  if (!result.data.user) throw new Error("Supabase did not return the invited user.");
  return { user: result.data.user, invited: true };
}

export async function claimPartnerInvitations(user: User) {
  if (!user.email) return 0;
  const admin = createAdminClient();
  const { data: invitations, error } = await admin
    .from("partner_invitations")
    .select("id, organization_id, role, player_id")
    .ilike("email", user.email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());
  if (error) throw error;
  let accepted = 0;
  for (const invitation of invitations ?? []) {
    if (invitation.role === "athlete" && invitation.player_id) {
      const { error: playerError } = await admin
        .from("players")
        .update({ user_id: user.id, invited_email: user.email })
        .eq("id", invitation.player_id)
        .or(`user_id.is.null,user_id.eq.${user.id}`);
      if (playerError) throw playerError;
    } else if (invitation.role !== "athlete") {
      const { error: membershipError } = await admin.from("partner_memberships").upsert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        status: "active",
      }, { onConflict: "organization_id,user_id" });
      if (membershipError) throw membershipError;
    }
    const { error: invitationError } = await admin.from("partner_invitations").update({
      status: "accepted",
      auth_user_id: user.id,
    }).eq("id", invitation.id);
    if (invitationError) throw invitationError;
    accepted += 1;
  }
  return accepted;
}

export function partnerSubscriptionEntitled(status: string) {
  return status === "active" || status === "trialing" || status === "past_due";
}

/**
 * Fully disables a partner tenant. This is intentionally idempotent because it
 * is called both by the admin status control and by operational recovery jobs.
 * Connected-account subscriptions must be canceled in Stripe; simply hiding
 * the tenant would leave the partner's customers paying indefinitely.
 */
export async function cancelPartnerOrganization(organizationId: string) {
  const admin = createAdminClient();
  const { data: organization, error: organizationError } = await admin
    .from("partner_organizations")
    .select("id, stripe_account_id")
    .eq("id", organizationId)
    .maybeSingle();
  if (organizationError) throw organizationError;
  if (!organization) throw new Error("Partner organization was not found.");

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("partner_customer_subscriptions")
    .select("id, stripe_subscription_id, stripe_account_id")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing", "past_due", "canceling"]);
  if (subscriptionError) throw subscriptionError;

  const cancellationErrors: string[] = [];
  for (const subscription of subscriptions ?? []) {
    let canceled = true;
    try {
      await getStripe().subscriptions.cancel(
        subscription.stripe_subscription_id,
        {},
        { stripeAccount: subscription.stripe_account_id },
      );
    } catch (error) {
      // A previously canceled/deleted subscription should not prevent the
      // tenant from being disabled. Preserve other failures for visibility.
      const message = error instanceof Error ? error.message : "Stripe cancellation failed.";
      if (!/no such subscription|already been canceled|resource_missing/i.test(message)) {
        cancellationErrors.push(`${subscription.stripe_subscription_id}: ${message}`);
        canceled = false;
      }
    }
    if (canceled) {
      const { error: ledgerError } = await admin
        .from("partner_customer_subscriptions")
        .update({ status: "canceled", cancel_at_period_end: false })
        .eq("id", subscription.id);
      if (ledgerError) throw ledgerError;
    }
  }

  const { error: checkoutError } = await admin
    .from("partner_profile_checkouts")
    .update({ active: false })
    .eq("organization_id", organizationId);
  if (checkoutError) throw checkoutError;

  const { error: linksError } = await admin
    .from("partner_payment_links")
    .update({ active: false })
    .eq("organization_id", organizationId);
  if (linksError) throw linksError;

  const { data: playersWithDomains, error: domainPlayersError } = await admin
    .from("players")
    .select("custom_domain,has_custom_domain")
    .eq("organization_id", organizationId)
    .eq("has_custom_domain", true);
  if (domainPlayersError) throw domainPlayersError;
  for (const player of playersWithDomains ?? []) {
    if (player.custom_domain) {
      try { await disableManagedDomainRenewal(player.custom_domain); }
      catch (error) { console.warn("Could not disable partner player domain renewal", { domain: player.custom_domain, error }); }
    }
  }

  const { error: playersError } = await admin
    .from("players")
    .update({
      partner_billing_status: "canceled",
      billing_tier: "free",
      subscription_status: "canceled",
      is_published: false,
      has_custom_domain: false,
      custom_domain_status: "canceled",
      partner_access_expires_at: null,
    })
    .eq("organization_id", organizationId);
  if (playersError) throw playersError;

  if (cancellationErrors.length > 0) {
    throw new Error(`Some connected subscriptions could not be canceled: ${cancellationErrors.join("; ")}`);
  }
}
