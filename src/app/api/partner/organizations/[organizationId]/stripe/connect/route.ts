import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { partnerAccess } from "@/lib/partners";
import {
  createPartnerStripeAccount,
  createPartnerStripeAccountLink,
  refreshPartnerStripeAccountStatus,
} from "@/lib/stripe-connect";

export async function POST(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) {
    return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  }

  try {
    let accountId = access.organization.stripe_account_id;
    let state;
    if (accountId) {
      state = await refreshPartnerStripeAccountStatus(organizationId, accountId);
    } else {
      const created = await createPartnerStripeAccount({
        organizationId,
        displayName: access.organization.name,
        contactEmail: access.organization.billing_email || user.email || "",
      });
      accountId = created.account.id;
      state = created.state;
    }

    const accountLink = await createPartnerStripeAccountLink({
      organizationId,
      accountId,
      onboardingComplete: state.onboardingComplete,
    });
    return NextResponse.json({ url: accountLink.url, status: state });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Stripe onboarding could not be started.",
    }, { status: 502 });
  }
}
