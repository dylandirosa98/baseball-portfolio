# Stripe environments and pricing

Diamond Profile separates test billing from live production billing.

| Environment | Stripe mode | Key type | App URL |
| --- | --- | --- | --- |
| Local development | Test | `sk_test_` or temporary `rk_test_` | `http://localhost:3000` |
| Vercel Preview | Test | Test credential | Preview URL |
| Vercel Production | Live | `sk_live_` | Production HTTPS URL |

Runtime guards reject live credentials outside Vercel Production, reject test credentials in Vercel Production, and reject webhook events whose mode does not match the deployment.

## Product model

- Free: 10 images, 5 embedded videos, and Diamond Profile hosting.
- Pro: $15/month, 25 images, 10 professionally hosted video uploads, and analytics.
- Elite: $25/month, fair-use unlimited images and professionally hosted videos, and analytics.
- Custom Domain: independent $10/month add-on available with Free, Pro, or Elite.

The included domain must be a standard-priced `.com`. Premium or unusually expensive domains are excluded. Diamond Profile purchases, connects, renews, and manages the domain while the add-on remains active.

## Local test setup

The test catalog has already been created:

- Pro: `price_1Tvu0bL5oLjtdDUPAX4mDt63`
- Elite: `price_1Tvu19L5oLjtdDUPOXRixCU8`
- Custom Domain: `price_1Tvu1AL5oLjtdDUPcRrbwLU8`

1. Copy `.env.local.example` to `.env.local` without overwriting existing Supabase values.
2. Add a Stripe test secret or temporary authenticated CLI test key.
3. Start the app with `npm run dev`.
4. In another terminal, run `npm run stripe:listen`.
5. Copy the listener's `whsec_...` value to `STRIPE_WEBHOOK_SECRET`, then restart the app.
6. Use Stripe test cards only.

The listener forwards:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Vercel production setup

The live Pro, Elite, and Custom Domain products and prices are created. Their IDs are recorded in `.env.production.example`.

The live webhook endpoint is enabled at `https://diamondprofile.app/api/stripe/webhook` for all four required events. The live Customer Portal is active for payment-method updates, invoice history, and cancellation at period end.

Add every value from `.env.production.example` to the Vercel Production environment, including the live webhook signing secret, then redeploy.

## Managed-domain fulfillment

Domain purchase, ownership, project attachment, and renewal use Vercel's current Registrar API. Add the Vercel token, team and project identifiers, Diamond Profile registrant contact, the purchase-price ceiling, and a random `CRON_SECRET` of at least 16 characters from `.env.production.example`.

Purchases are tracked by Vercel order ID because registration can finish asynchronously. The Stripe checkout event starts the order, and the secured `/api/domains/reconcile` cron route completes pending ownership and project attachment. `vercel.json` schedules a portable daily safety reconciliation; successful standard registrations can still complete during the initial checkout webhook. Canceling the domain add-on disables registrar auto-renewal, and reactivation enables it again.

## Database

All migrations through `20260723010000_managed_domain_status.sql` are applied to the linked project. They include billing state, analytics, slug availability, hosted-video ownership, and managed-domain fulfillment status.
