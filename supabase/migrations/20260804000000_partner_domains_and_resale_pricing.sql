-- White-label domains and transparent partner resale economics.

alter table public.partner_organizations
  add column if not exists profile_domain_error text,
  add column if not exists profile_domain_verification jsonb not null default '[]'::jsonb,
  add column if not exists profile_domain_verified_at timestamptz;

alter table public.partner_payment_links
  add column if not exists platform_cost_cents integer,
  add column if not exists partner_margin_cents integer;

alter table public.partner_payment_links
  drop constraint if exists partner_payment_links_platform_cost_check,
  drop constraint if exists partner_payment_links_margin_check;

alter table public.partner_payment_links
  add constraint partner_payment_links_platform_cost_check
    check (platform_cost_cents is null or platform_cost_cents >= 0),
  add constraint partner_payment_links_margin_check
    check (partner_margin_cents is null or partner_margin_cents >= 0);

alter table public.partner_organizations
  alter column domain_wholesale_cents set default 1000;

update public.partner_organizations
set domain_wholesale_cents = 1000
where domain_wholesale_cents = 1800;

-- Existing links inherit the platform wholesale base for their organization.
update public.partner_payment_links links
set platform_cost_cents = case
  when organizations.partnership_type = 'white_label' and links.tier = 'pro' then 400
  when organizations.partnership_type = 'white_label' and links.tier = 'elite' then 600
  when links.tier = 'pro' then 800
  else 1200
end,
partner_margin_cents = greatest(0, coalesce(links.unit_amount, 0) - case
  when organizations.partnership_type = 'white_label' and links.tier = 'pro' then 400
  when organizations.partnership_type = 'white_label' and links.tier = 'elite' then 600
  when links.tier = 'pro' then 800
  else 1200
end)
from public.partner_organizations organizations
where organizations.id = links.organization_id
  and links.platform_cost_cents is null;

comment on column public.partner_organizations.profile_domain is 'White-label apex domain. Builder uses build.<domain>; athlete profiles use <slug>.<domain>.';
comment on column public.partner_organizations.profile_domain_verification is 'Vercel DNS verification records for the apex and builder host.';
comment on column public.partner_payment_links.platform_cost_cents is 'Monthly Diamond Profile wholesale cost collected through the platform billing subscription.';
comment on column public.partner_payment_links.partner_margin_cents is 'Partner retail price minus the platform wholesale cost.';
