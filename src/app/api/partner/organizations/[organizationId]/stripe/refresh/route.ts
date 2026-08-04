import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { partnerAccess } from "@/lib/partners";
import { createPartnerStripeAccountLink, refreshPartnerStripeAccountStatus } from "@/lib/stripe-connect";

/**
 * Stripe Account Links expire and can only be used once. Stripe redirects here
 * when a replacement is required; authentication prevents leaked refresh URLs
 * from creating onboarding sessions for another organization.
 */
export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/auth?next=${encodeURIComponent(`/partner/${organizationId}`)}`, _request.url));
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access?.organization.stripe_account_id) {
    return NextResponse.redirect(new URL(`/partner/${organizationId}?stripe=missing`, _request.url));
  }

  try {
    const state = await refreshPartnerStripeAccountStatus(organizationId, access.organization.stripe_account_id);
    const link = await createPartnerStripeAccountLink({
      organizationId,
      accountId: access.organization.stripe_account_id,
      onboardingComplete: state.onboardingComplete,
    });
    return NextResponse.redirect(link.url);
  } catch {
    return NextResponse.redirect(new URL(`/partner/${organizationId}?stripe=failed`, _request.url));
  }
}
