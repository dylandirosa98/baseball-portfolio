alter table public.players
  add column if not exists hero_image_scale integer;

alter table public.players
  drop constraint if exists players_hero_image_scale_check;

alter table public.players
  add constraint players_hero_image_scale_check
  check (hero_image_scale is null or hero_image_scale between 80 and 150);
