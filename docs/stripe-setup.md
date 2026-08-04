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

## Partner and white-label billing

The private `/admin` dashboard creates either a standard partner or a white-label
organization. Each organization receives its own workspace, team memberships,
branding settings, athlete profiles, and billing ledger.

1. Create the organization from **Admin → Partners and white labels**.
2. The partner owner signs in, adds a billing card for wholesale seat billing,
   and connects their own Stripe account through Stripe Connect.
3. In the partner workspace, the owner pastes one recurring Stripe Payment Link
   for each tier. Diamond Profile verifies that each link belongs to the
   connected account before it can be assigned to an athlete.
4. Creating an athlete generates a permanent `/p/{token}` checkout route. The
   route forwards to the selected partner Payment Link and adds the token as
   Stripe's `client_reference_id`, which maps the completed subscription back to
   that athlete.

The Connect webhook at `/api/stripe/connect-webhook` records subscription
creation, changes, payment failures, and cancellations. A canceled or unpaid
subscription immediately loses the athlete's paid entitlement and profile
publishing access. Wholesale billing is reconciled from currently entitled
athlete seats, so the platform subscription quantity falls when an athlete
cancels. Canceling a partner from the platform admin also disables new checkout
links, unpublishes its profiles, and cancels connected subscriptions.

White-label organizations use the same workflow at lower wholesale prices and
can replace the Diamond Profile logo, name, support email, accent color, and
footer branding on their managed profiles. They can connect their business
domain from the workspace; management is served from `admin.<domain>`, the
branded builder from `builder.<domain>`, and each athlete profile from
`<slug>.<domain>`. The apex is never attached or redirected, so the partner's
existing business website stays in place. The app attaches every exact athlete
hostname to Vercel while the partner supplies the wildcard CNAME.

White-label economics are explicit: Diamond Profile charges the organization
$4/month for each Pro seat, $6/month for each Elite seat, $200/month for the
platform, and $10/month for each separately purchased player domain. Partners
choose any retail price at or above the platform base in their connected Stripe
checkout; for example, a $15 Pro checkout leaves an $11 gross margin before
their other costs. Canceled seats and canceled player domains are removed from
the platform quantity reconciliation.

New white-label organizations begin in preview mode. Their invited owner can
sign in, see the workspace, and prepare branding, but athlete and branded-domain
features unlock only after the white-label platform checkout completes. That
Stripe checkout accepts promotion codes.

## Database

Migrations include billing state, analytics, slug availability, hosted-video
ownership, managed-domain fulfillment, partner/white-label tenants, and the
trialing Stripe subscription state. Apply all files in
`supabase/migrations/` to the linked project before enabling partner billing.
