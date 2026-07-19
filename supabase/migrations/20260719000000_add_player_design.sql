alter table public.players
  add column if not exists design text not null default 'design-1';

alter table public.players
  drop constraint if exists players_design_check;

alter table public.players
  add constraint players_design_check
  check (design in ('design-1', 'design-2', 'design-3'));
