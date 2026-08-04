-- Distinguish organization catalog pricing from one-off athlete offers.
alter table public.partner_payment_links
  add column if not exists pricing_scope text not null default 'catalog',
  add column if not exists player_id uuid references public.players(id) on delete cascade;

alter table public.partner_payment_links
  drop constraint if exists partner_payment_links_pricing_scope_check;

alter table public.partner_payment_links
  add constraint partner_payment_links_pricing_scope_check
    check (pricing_scope in ('catalog', 'athlete'));

-- Older connected Payment Links become the organization catalog. Keep only the
-- newest active link for each tier so every partner has one unambiguous default.
with ranked as (
  select id,
    row_number() over (
      partition by organization_id, tier
      order by verified_at desc nulls last, created_at desc, id desc
    ) as position
  from public.partner_payment_links
  where active = true and pricing_scope = 'catalog'
)
update public.partner_payment_links links
set active = false
from ranked
where links.id = ranked.id and ranked.position > 1;

create unique index if not exists partner_catalog_active_tier_idx
  on public.partner_payment_links (organization_id, tier)
  where active = true and pricing_scope = 'catalog';

create unique index if not exists partner_athlete_active_price_idx
  on public.partner_payment_links (player_id)
  where active = true and pricing_scope = 'athlete';

create index if not exists partner_payment_links_scope_idx
  on public.partner_payment_links (organization_id, pricing_scope, active);

comment on column public.partner_payment_links.pricing_scope is
  'Catalog prices are the organization defaults; athlete prices are private custom offers.';
comment on column public.partner_payment_links.player_id is
  'The athlete receiving a private custom retail price, null for catalog pricing.';
