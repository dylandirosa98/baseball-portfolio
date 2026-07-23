create table if not exists public.mux_uploads (
  upload_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting',
  asset_id text,
  playback_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mux_uploads_user_id_idx on public.mux_uploads(user_id);

alter table public.mux_uploads enable row level security;

drop policy if exists "Owners can view mux uploads" on public.mux_uploads;
create policy "Owners can view mux uploads"
  on public.mux_uploads for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owners can create mux uploads" on public.mux_uploads;
create policy "Owners can create mux uploads"
  on public.mux_uploads for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update mux uploads" on public.mux_uploads;
create policy "Owners can update mux uploads"
  on public.mux_uploads for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.mux_uploads is 'Ownership ledger for Mux direct uploads and status polling.';
