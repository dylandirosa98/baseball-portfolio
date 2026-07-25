-- Multi-tenant partner, reseller, and white-label support.

create table if not exists public.partner_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  partnership_type text not null default 'partner'
    check (partnership_type in ('partner', 'white_label')),
  status text not null default 'active'
    check (status in ('draft', 'active', 'suspended', 'canceled')),
  billing_email text,
  stripe_account_id text unique,
  stripe_account_status text not null default 'not_connected'
    check (stripe_account_status in ('not_connected', 'pending', 'active', 'restricted', 'disconnected')),
  platform_stripe_customer_id text unique,
  platform_stripe_subscription_id text unique,
  platform_subscription_status text not null default 'inactive',
  billing_payment_method_ready boolean not null default false,
  platform_base_item_id text,
  platform_pro_item_id text,
  platform_elite_item_id text,
  platform_domain_item_id text,
  billing_sync_error text,
  billing_synced_at timestamptz,
  pro_wholesale_cents integer not null default 800 check (pro_wholesale_cents >= 0),
  elite_wholesale_cents integer not null default 1200 check (elite_wholesale_cents >= 0),
  domain_wholesale_cents integer not null default 1800 check (domain_wholesale_cents >= 0),
  white_label_monthly_cents integer not null default 20000 check (white_label_monthly_cents >= 0),
  logo_url text,
  primary_color text not null default '#e5162a' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  support_email text,
  profile_domain text unique,
  profile_domain_status text not null default 'none'
    check (profile_domain_status in ('none', 'pending', 'active', 'failed')),
  hide_diamond_branding boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.partner_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer', 'athlete')),
  player_id uuid references public.players(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists partner_invitations_pending_email_idx
  on public.partner_invitations (organization_id, lower(email), role)
  where status = 'pending';

create table if not exists public.partner_payment_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  name text not null,
  tier text not null check (tier in ('pro', 'elite')),
  stripe_payment_link_id text not null,
  stripe_price_id text,
  url text not null,
  currency text,
  unit_amount integer,
  recurring_interval text,
  active boolean not null default true,
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, stripe_payment_link_id)
);

create table if not exists public.partner_profile_checkouts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  payment_link_id uuid not null references public.partner_payment_links(id) on delete cascade,
  active boolean not null default true,
  last_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, payment_link_id)
);

create table if not exists public.partner_customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  payment_link_id uuid references public.partner_payment_links(id) on delete set null,
  stripe_account_id text not null,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text not null,
  tier text not null check (tier in ('pro', 'elite')),
  status text not null,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  last_event_created bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stripe_account_id, stripe_subscription_id)
);

create table if not exists public.partner_stripe_oauth_states (
  state text primary key,
  organization_id uuid not null references public.partner_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.players
  alter column user_id drop not null,
  add column if not exists organization_id uuid references public.partner_organizations(id) on delete set null,
  add column if not exists invited_email text,
  add column if not exists partner_plan text check (partner_plan in ('pro', 'elite')),
  add column if not exists partner_billing_source text
    check (partner_billing_source in ('customer_subscription', 'partner_paid')),
  add column if not exists partner_billing_status text not null default 'none'
    check (partner_billing_status in ('none', 'pending', 'active', 'past_due', 'canceling', 'canceled', 'unpaid')),
  add column if not exists partner_payment_link_id uuid references public.partner_payment_links(id) on delete set null,
  add column if not exists partner_stripe_customer_id text,
  add column if not exists partner_stripe_subscription_id text,
  add column if not exists partner_access_expires_at timestamptz;

create index if not exists players_organization_id_idx on public.players(organization_id);
create index if not exists players_partner_subscription_idx on public.players(partner_stripe_subscription_id);
create index if not exists partner_memberships_user_id_idx on public.partner_memberships(user_id);
create index if not exists partner_subscriptions_player_idx on public.partner_customer_subscriptions(player_id);

alter table public.mux_uploads
  add column if not exists player_id uuid references public.players(id) on delete cascade;

create index if not exists mux_uploads_player_id_idx on public.mux_uploads(player_id);

create or replace function public.is_partner_member(target_organization_id uuid, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_memberships
    where partner_memberships.organization_id = target_organization_id
      and partner_memberships.user_id = auth.uid()
      and partner_memberships.status = 'active'
      and (allowed_roles is null or partner_memberships.role = any(allowed_roles))
  );
$$;

revoke all on function public.is_partner_member(uuid, text[]) from public;
grant execute on function public.is_partner_member(uuid, text[]) to authenticated;

alter table public.partner_organizations enable row level security;
alter table public.partner_memberships enable row level security;
alter table public.partner_invitations enable row level security;
alter table public.partner_payment_links enable row level security;
alter table public.partner_profile_checkouts enable row level security;
alter table public.partner_customer_subscriptions enable row level security;
alter table public.partner_stripe_oauth_states enable row level security;

drop policy if exists "Members can view partner organizations" on public.partner_organizations;
create policy "Members can view partner organizations"
  on public.partner_organizations for select to authenticated
  using (public.is_partner_member(id));

drop policy if exists "Members can view organization memberships" on public.partner_memberships;
create policy "Members can view organization memberships"
  on public.partner_memberships for select to authenticated
  using (public.is_partner_member(organization_id));

drop policy if exists "Partner admins can manage organization memberships" on public.partner_memberships;
create policy "Partner admins can manage organization memberships"
  on public.partner_memberships for all to authenticated
  using (public.is_partner_member(organization_id, array['owner', 'admin']))
  with check (public.is_partner_member(organization_id, array['owner', 'admin']));

drop policy if exists "Members can view partner invitations" on public.partner_invitations;
create policy "Members can view partner invitations"
  on public.partner_invitations for select to authenticated
  using (public.is_partner_member(organization_id));

drop policy if exists "Partner admins can manage invitations" on public.partner_invitations;
create policy "Partner admins can manage invitations"
  on public.partner_invitations for all to authenticated
  using (public.is_partner_member(organization_id, array['owner', 'admin']))
  with check (public.is_partner_member(organization_id, array['owner', 'admin']));

drop policy if exists "Members can view payment links" on public.partner_payment_links;
create policy "Members can view payment links"
  on public.partner_payment_links for select to authenticated
  using (public.is_partner_member(organization_id));

drop policy if exists "Partner admins can manage payment links" on public.partner_payment_links;
create policy "Partner admins can manage payment links"
  on public.partner_payment_links for all to authenticated
  using (public.is_partner_member(organization_id, array['owner', 'admin']))
  with check (public.is_partner_member(organization_id, array['owner', 'admin']));

drop policy if exists "Members can view profile checkouts" on public.partner_profile_checkouts;
create policy "Members can view profile checkouts"
  on public.partner_profile_checkouts for select to authenticated
  using (public.is_partner_member(organization_id));

drop policy if exists "Partner admins can manage profile checkouts" on public.partner_profile_checkouts;
create policy "Partner admins can manage profile checkouts"
  on public.partner_profile_checkouts for all to authenticated
  using (public.is_partner_member(organization_id, array['owner', 'admin']))
  with check (public.is_partner_member(organization_id, array['owner', 'admin']));

drop policy if exists "Members can view customer subscriptions" on public.partner_customer_subscriptions;
create policy "Members can view customer subscriptions"
  on public.partner_customer_subscriptions for select to authenticated
  using (public.is_partner_member(organization_id));

drop policy if exists "Partners can view organization players" on public.players;
create policy "Partners can view organization players"
  on public.players for select to authenticated
  using (organization_id is not null and public.is_partner_member(organization_id));

drop policy if exists "Partner editors can create organization players" on public.players;
create policy "Partner editors can create organization players"
  on public.players for insert to authenticated
  with check (
    organization_id is not null
    and public.is_partner_member(organization_id, array['owner', 'admin', 'editor'])
  );

drop policy if exists "Partner editors can update organization players" on public.players;
create policy "Partner editors can update organization players"
  on public.players for update to authenticated
  using (
    organization_id is not null
    and public.is_partner_member(organization_id, array['owner', 'admin', 'editor'])
  )
  with check (
    organization_id is not null
    and public.is_partner_member(organization_id, array['owner', 'admin', 'editor'])
  );

drop policy if exists "Partner admins can delete organization players" on public.players;
create policy "Partner admins can delete organization players"
  on public.players for delete to authenticated
  using (
    organization_id is not null
    and public.is_partner_member(organization_id, array['owner', 'admin'])
  );

drop policy if exists "Partners can view organization analytics" on public.portfolio_analytics_daily;
create policy "Partners can view organization analytics"
  on public.portfolio_analytics_daily for select to authenticated
  using (
    exists (
      select 1 from public.players
      where players.id = portfolio_analytics_daily.player_id
        and players.organization_id is not null
        and public.is_partner_member(players.organization_id)
    )
  );

drop policy if exists "Partners can view player mux uploads" on public.mux_uploads;
create policy "Partners can view player mux uploads"
  on public.mux_uploads for select to authenticated
  using (
    player_id is not null
    and exists (
      select 1 from public.players
      where players.id = mux_uploads.player_id
        and players.organization_id is not null
        and public.is_partner_member(players.organization_id)
    )
  );

drop policy if exists "Partners can create player mux uploads" on public.mux_uploads;
create policy "Partners can create player mux uploads"
  on public.mux_uploads for insert to authenticated
  with check (
    user_id = auth.uid()
    and player_id is not null
    and exists (
      select 1 from public.players
      where players.id = mux_uploads.player_id
        and players.organization_id is not null
        and public.is_partner_member(players.organization_id, array['owner', 'admin', 'editor'])
    )
  );

drop policy if exists "Partners can update player mux uploads" on public.mux_uploads;
create policy "Partners can update player mux uploads"
  on public.mux_uploads for update to authenticated
  using (
    user_id = auth.uid()
    and player_id is not null
    and exists (
      select 1 from public.players
      where players.id = mux_uploads.player_id
        and players.organization_id is not null
        and public.is_partner_member(players.organization_id, array['owner', 'admin', 'editor'])
    )
  );

drop trigger if exists on_partner_organizations_updated on public.partner_organizations;
create trigger on_partner_organizations_updated before update on public.partner_organizations
  for each row execute procedure public.handle_updated_at();
drop trigger if exists on_partner_memberships_updated on public.partner_memberships;
create trigger on_partner_memberships_updated before update on public.partner_memberships
  for each row execute procedure public.handle_updated_at();
drop trigger if exists on_partner_invitations_updated on public.partner_invitations;
create trigger on_partner_invitations_updated before update on public.partner_invitations
  for each row execute procedure public.handle_updated_at();
drop trigger if exists on_partner_payment_links_updated on public.partner_payment_links;
create trigger on_partner_payment_links_updated before update on public.partner_payment_links
  for each row execute procedure public.handle_updated_at();
drop trigger if exists on_partner_profile_checkouts_updated on public.partner_profile_checkouts;
create trigger on_partner_profile_checkouts_updated before update on public.partner_profile_checkouts
  for each row execute procedure public.handle_updated_at();
drop trigger if exists on_partner_customer_subscriptions_updated on public.partner_customer_subscriptions;
create trigger on_partner_customer_subscriptions_updated before update on public.partner_customer_subscriptions
  for each row execute procedure public.handle_updated_at();

comment on table public.partner_organizations is 'Partner and white-label tenants with wholesale pricing and brand configuration.';
comment on table public.partner_payment_links is 'Subscription Payment Links owned by a connected partner Stripe account.';
comment on table public.partner_profile_checkouts is 'Permanent athlete-specific checkout tokens appended as Stripe client_reference_id values.';
comment on table public.partner_customer_subscriptions is 'Connected-account subscription ledger used to grant and revoke athlete entitlements.';
