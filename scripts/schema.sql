-- Diamond Portfolio: consumer-owned baseball portfolios

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text unique not null,
  first_name text not null default '',
  last_name text not null default '',
  position text not null default 'Shortstop',
  number integer not null default 0,
  team text not null default '',
  league text not null default '',
  hometown text default '',
  height text default '',
  weight text default '',
  bats text default 'Right' check (bats in ('Left', 'Right', 'Switch')),
  throws text default 'Right' check (throws in ('Left', 'Right')),
  birth_year integer default 0,
  bio text default '',
  headshot_url text default '/images/headshot-placeholder.svg',
  hero_image_url text default '/images/hero-placeholder.svg',
  current_stats jsonb not null default '{}',
  season_history jsonb not null default '[]',
  highlights jsonb not null default '[]',
  social_links jsonb not null default '[]',
  theme_color text not null default '#ef4444',
  number_color text,
  highlight_reel_url text,
  resume_url text,
  skillsets jsonb not null default '[]',
  section_order jsonb not null default '[]',
  interests text default '',
  interests_media jsonb not null default '[]',
  training_video_url text,
  training_description text default '',
  training_videos jsonb not null default '[]',
  timeline jsonb not null default '[]',
  transcript_url text,
  show_stats_bar boolean not null default true,
  light_mode boolean not null default false,
  custom_domain text unique,
  team_logo_url text,
  media jsonb not null default '[]',
  plan text check (plan in ('standard', 'premium')),
  subscription_status text not null default 'inactive',
  stripe_customer_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_players_updated on public.players;
create trigger on_players_updated
  before update on public.players
  for each row execute procedure public.handle_updated_at();

alter table public.players enable row level security;

drop policy if exists "Public can view published players" on public.players;
create policy "Public can view published players"
  on public.players for select
  using (is_published = true or auth.uid() = user_id);

drop policy if exists "Owners can create portfolios" on public.players;
create policy "Owners can create portfolios"
  on public.players for insert
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update portfolios" on public.players;
create policy "Owners can update portfolios"
  on public.players for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners can delete portfolios" on public.players;
create policy "Owners can delete portfolios"
  on public.players for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-images',
  'player-images',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view player images" on storage.objects;
create policy "Public can view player images"
  on storage.objects for select
  using (bucket_id = 'player-images');

drop policy if exists "Owners can upload player images" on storage.objects;
create policy "Owners can upload player images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'player-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can update player images" on storage.objects;
create policy "Owners can update player images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'player-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners can delete player images" on storage.objects;
create policy "Owners can delete player images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'player-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
