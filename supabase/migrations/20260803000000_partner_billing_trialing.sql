-- Connected Stripe subscriptions can be in trialing status. Keep that
-- status entitled so trial periods do not fail webhook reconciliation.

alter table public.players
  drop constraint if exists players_partner_billing_status_check;

alter table public.players
  add constraint players_partner_billing_status_check
  check (partner_billing_status in (
    'none', 'pending', 'trialing', 'active', 'past_due',
    'canceling', 'canceled', 'unpaid'
  ));
