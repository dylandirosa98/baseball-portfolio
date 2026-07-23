create or replace function public.is_player_slug_available(candidate_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.players
    where players.slug = candidate_slug
      and players.user_id is distinct from auth.uid()
  );
$$;

revoke all on function public.is_player_slug_available(text) from public;
grant execute on function public.is_player_slug_available(text) to anon, authenticated;
