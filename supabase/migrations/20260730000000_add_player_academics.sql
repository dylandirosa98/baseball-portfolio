alter table public.players
  add column if not exists school text,
  add column if not exists gpa text;
