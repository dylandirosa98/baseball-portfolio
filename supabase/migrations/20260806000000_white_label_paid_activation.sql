-- White-label workspaces are visible to invited owners before checkout, but
-- operational features remain locked until the platform subscription activates.
update public.partner_organizations
set
  wholesale_billing_exempt = false,
  wholesale_billing_exempt_reason = null,
  status = case
    when platform_subscription_status in ('active', 'trialing', 'past_due') then 'active'
    else 'draft'
  end
where partnership_type = 'white_label'
  and status not in ('canceled', 'suspended');

comment on column public.partner_organizations.status is
  'White-label organizations remain draft and visible in preview mode until Stripe activates the platform subscription.';

comment on column public.partner_organizations.profile_domain is
  'Partner business apex used only as the suffix for admin, builder, and athlete hosts. The apex itself is not attached or redirected.';

comment on column public.partner_organizations.profile_domain_verification is
  'Vercel verification records for admin, builder, and exact athlete hostnames; never the partner apex.';
