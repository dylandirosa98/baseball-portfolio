alter table public.players
  add column if not exists custom_domain_status text not null default 'none'
    check (custom_domain_status in ('none', 'purchasing', 'active', 'failed', 'canceled')),
  add column if not exists custom_domain_order_id text,
  add column if not exists custom_domain_purchase_price numeric,
  add column if not exists custom_domain_error text;

comment on column public.players.custom_domain_status is 'Managed registrar fulfillment state for the custom-domain add-on.';
