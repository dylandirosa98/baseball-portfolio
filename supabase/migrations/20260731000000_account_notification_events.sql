create table if not exists public.account_notification_events (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.account_notification_events enable row level security;

comment on table public.account_notification_events is
  'Server-only deduplication records for new account notification emails.';
