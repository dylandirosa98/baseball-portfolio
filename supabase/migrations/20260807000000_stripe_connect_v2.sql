-- Stripe Accounts v2 is the source of truth for partner onboarding. These
-- columns only cache the latest webhook/API result for admin reporting.
alter table public.partner_organizations
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_requirements_status text
    check (stripe_requirements_status is null or stripe_requirements_status in ('currently_due', 'eventually_due', 'past_due')),
  add column if not exists stripe_status_checked_at timestamptz;

comment on column public.partner_organizations.stripe_account_id is
  'Stripe V2 Account ID configured as both merchant and customer for this partner.';
comment on column public.partner_organizations.platform_stripe_customer_id is
  'Legacy v1 wholesale Customer ID. New partner billing uses stripe_account_id as customer_account.';
comment on column public.partner_organizations.stripe_onboarding_complete is
  'Cached Connect onboarding result. User-facing status must be retrieved directly from Stripe.';
comment on column public.partner_organizations.stripe_requirements_status is
  'Cached minimum Stripe requirements deadline status from the V2 Account.';
