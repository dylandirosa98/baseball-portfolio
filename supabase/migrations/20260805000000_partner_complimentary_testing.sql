alter table public.partner_organizations
  add column if not exists wholesale_billing_exempt boolean not null default false,
  add column if not exists wholesale_billing_exempt_reason text;

comment on column public.partner_organizations.wholesale_billing_exempt is
  'Platform-admin-controlled exemption for the white-label base and athlete wholesale charges. Managed domain charges are never exempt.';

comment on column public.partner_organizations.profile_domain is
  'White-label apex domain. Builder uses builder.<domain>, partner management uses admin.<domain>, and athlete profiles use <slug>.<domain>.';

comment on column public.partner_organizations.profile_domain_verification is
  'Vercel DNS verification records for the apex, builder, admin, and wildcard hosts.';
