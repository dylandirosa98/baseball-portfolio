-- Service-only operational settings that can be changed without a deployment.
create table if not exists public.platform_settings (
  key text primary key,
  value text not null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop trigger if exists on_platform_settings_updated on public.platform_settings;
create trigger on_platform_settings_updated before update on public.platform_settings
  for each row execute procedure public.handle_updated_at();

comment on table public.platform_settings is 'Service-role-only operational configuration managed from the private platform admin.';
