alter table public.players
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_price_ids text[] not null default '{}',
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists stripe_event_created_at bigint not null default 0,
  add column if not exists billing_tier text not null default 'free'
    check (billing_tier in ('free', 'pro', 'elite')),
  add column if not exists has_custom_domain boolean not null default false,
  add column if not exists mux_upload_count integer not null default 0
    check (mux_upload_count >= 0);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  created bigint not null,
  status text not null check (status in ('processing', 'processed', 'failed')),
  error text,
  processed_at timestamptz,
  inserted_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
comment on table public.stripe_webhook_events is 'Server-only Stripe event ledger for idempotent webhook processing.';
comment on column public.players.billing_tier is 'Free, Pro, or Elite portfolio feature entitlement.';
comment on column public.players.has_custom_domain is 'Active managed custom-domain add-on, independent of billing tier.';
comment on column public.players.mux_upload_count is 'Number of Mux direct uploads initiated for quota enforcement.';

create table if not exists public.portfolio_analytics_daily (
  player_id uuid not null references public.players(id) on delete cascade,
  day date not null default current_date,
  profile_views bigint not null default 0 check (profile_views >= 0),
  video_plays bigint not null default 0 check (video_plays >= 0),
  primary key (player_id, day)
);

alter table public.portfolio_analytics_daily enable row level security;

drop policy if exists "Owners can view portfolio analytics" on public.portfolio_analytics_daily;
create policy "Owners can view portfolio analytics"
  on public.portfolio_analytics_daily for select to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.id = portfolio_analytics_daily.player_id
        and players.user_id = auth.uid()
        and players.billing_tier in ('pro', 'elite')
    )
  );

create or replace function public.record_portfolio_event(target_slug text, event_metric text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player_id uuid;
begin
  if event_metric not in ('profile_view', 'video_play') then
    raise exception 'Unsupported analytics metric';
  end if;

  select id into target_player_id
  from public.players
  where slug = target_slug
    and is_published = true;

  if target_player_id is null then
    return;
  end if;

  insert into public.portfolio_analytics_daily (player_id, day, profile_views, video_plays)
  values (
    target_player_id,
    current_date,
    case when event_metric = 'profile_view' then 1 else 0 end,
    case when event_metric = 'video_play' then 1 else 0 end
  )
  on conflict (player_id, day) do update set
    profile_views = portfolio_analytics_daily.profile_views + excluded.profile_views,
    video_plays = portfolio_analytics_daily.video_plays + excluded.video_plays;
end;
$$;

revoke all on function public.record_portfolio_event(text, text) from public;
grant execute on function public.record_portfolio_event(text, text) to anon, authenticated;
