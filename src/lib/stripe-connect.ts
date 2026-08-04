import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";

export type PartnerStripeAccountStatus = {
  accountId: string;
  status: "pending" | "active" | "restricted" | "disconnected";
  readyToProcessPayments: boolean;
  onboardingComplete: boolean;
  requirementsStatus: "currently_due" | "eventually_due" | "past_due" | null;
};

/**
 * Convert Stripe's live V2 Account state into the smaller status model used by
 * the partner workspace. Stripe remains the source of truth: callers retrieve
 * the Account from Stripe before displaying this value.
 */
export function partnerStripeAccountStatus(account: Stripe.V2.Core.Account): PartnerStripeAccountStatus {
  const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status ?? null;
  const readyToProcessPayments = account.configuration?.merchant?.capabilities?.card_payments?.status === "active";
  const onboardingComplete = Boolean(account.configuration?.merchant)
    && requirementsStatus !== "currently_due"
    && requirementsStatus !== "past_due";
  const status = account.closed
    ? "disconnected"
    : readyToProcessPayments && onboardingComplete
      ? "active"
      : requirementsStatus === "past_due"
        ? "restricted"
        : "pending";

  return {
    accountId: account.id,
    status,
    readyToProcessPayments,
    onboardingComplete,
    requirementsStatus,
  };
}

/** Retrieve all fields needed to evaluate onboarding directly from Stripe. */
export async function retrievePartnerStripeAccount(accountId: string) {
  return getStripe().v2.core.accounts.retrieve(accountId, {
    include: ["configuration.customer", "configuration.merchant", "requirements"],
  });
}

/**
 * Cache the last Stripe result for webhook-driven admin reporting. Partner UI
 * never trusts this cache; it calls retrievePartnerStripeAccount each render.
 */
export async function cachePartnerStripeAccountStatus(organizationId: string, account: Stripe.V2.Core.Account) {
  const state = partnerStripeAccountStatus(account);
  const { error } = await createAdminClient().from("partner_organizations").update({
    stripe_account_status: state.status,
    stripe_onboarding_complete: state.onboardingComplete,
    stripe_requirements_status: state.requirementsStatus,
    stripe_status_checked_at: new Date().toISOString(),
  }).eq("id", organizationId).eq("stripe_account_id", account.id);
  if (error) throw error;
  return state;
}

export async function refreshPartnerStripeAccountStatus(organizationId: string, accountId: string) {
  const account = await retrievePartnerStripeAccount(accountId);
  return cachePartnerStripeAccountStatus(organizationId, account);
}

/**
 * Create the connected V2 Account once and map its acct_ ID to the partner
 * organization. These are intentionally the only properties sent at creation:
 * Stripe collects all sensitive identity and payout details during onboarding.
 */
export async function createPartnerStripeAccount(input: {
  organizationId: string;
  displayName: string;
  contactEmail: string;
}) {
  if (!input.contactEmail) throw new Error("A billing email is required before Stripe onboarding can begin.");

  const account = await getStripe().v2.core.accounts.create({
    display_name: input.displayName,
    contact_email: input.contactEmail,
    identity: { country: "us" },
    dashboard: "full",
    defaults: {
      responsibilities: {
        fees_collector: "stripe",
        losses_collector: "stripe",
      },
    },
    configuration: {
      customer: {},
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
    },
  });

  const state = partnerStripeAccountStatus(account);
  const { error } = await createAdminClient().from("partner_organizations").update({
    stripe_account_id: account.id,
    stripe_account_status: state.status,
    stripe_onboarding_complete: state.onboardingComplete,
    stripe_requirements_status: state.requirementsStatus,
    stripe_status_checked_at: new Date().toISOString(),
  }).eq("id", input.organizationId).is("stripe_account_id", null);
  if (error) throw error;
  return { account, state };
}

/**
 * Account Links are single-use. The refresh URL points to an authenticated
 * route that generates a replacement when Stripe reports an expired link.
 */
export async function createPartnerStripeAccountLink(input: {
  organizationId: string;
  accountId: string;
  onboardingComplete: boolean;
}) {
  const root = getAppUrl();
  const refreshUrl = `${root}/api/partner/organizations/${input.organizationId}/stripe/refresh`;
  const returnUrl = `${root}/partner/${input.organizationId}?stripe=returned`;
  const collectionOptions = { fields: "eventually_due" as const, future_requirements: "include" as const };

  return input.onboardingComplete
    ? getStripe().v2.core.accountLinks.create({
      account: input.accountId,
      use_case: {
        type: "account_update",
        account_update: {
          configurations: ["merchant", "customer"],
          collection_options: collectionOptions,
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    })
    : getStripe().v2.core.accountLinks.create({
      account: input.accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "customer"],
          collection_options: collectionOptions,
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    });
}
