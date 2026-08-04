-- Partner athlete onboarding can begin with either the athlete or the
-- organization building the draft. Invitation tokens are durable entry points;
-- Supabase sign-in links remain short-lived and are generated only when sent.
alter table public.partner_invitations
  add column if not exists token uuid not null default gen_random_uuid(),
  add column if not exists athlete_creation_mode text not null default 'athlete_builds',
  add column if not exists last_sent_at timestamptz,
  add column if not exists send_count integer not null default 0;

create unique index if not exists partner_invitations_token_idx
  on public.partner_invitations (token);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_invitations_athlete_creation_mode_check'
  ) then
    alter table public.partner_invitations
      add constraint partner_invitations_athlete_creation_mode_check
      check (athlete_creation_mode in ('athlete_builds', 'organization_builds'));
  end if;
end $$;

alter table public.players
  add column if not exists partner_creation_mode text not null default 'athlete_builds';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'players_partner_creation_mode_check'
  ) then
    alter table public.players
      add constraint players_partner_creation_mode_check
      check (partner_creation_mode in ('athlete_builds', 'organization_builds'));
  end if;
end $$;

comment on column public.partner_invitations.token is
  'Durable, revocable athlete onboarding URL token. This is not an authentication credential.';
comment on column public.partner_invitations.athlete_creation_mode is
  'Whether the athlete begins in the builder or receives an organization-built preview.';
