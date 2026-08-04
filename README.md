# baseball-portfolio

A mobile-first builder for baseball players and families to create a polished recruiting website with one shareable link.

## Included

- Seven-step phone-friendly portfolio builder with live preview and local autosave
- Baseball positions, bats/throws, and position-specific hitting or pitching stats
- Photos, background removal, video, training, academics, social links, and player story
- Supabase email/password authentication and cloud portfolio sync
- Owner-scoped row-level security and media storage
- Free, Pro ($15/month), and Elite ($25/month) plans with enforced media entitlements
- Independent $10/month managed custom-domain add-on
- Signed, idempotent Stripe webhooks and Stripe Customer Portal billing management
- Automated standard-price .com search, purchase, renewal, and Vercel project connection
- Authenticated player dashboard for site management, billing, usage, domain status, and paid analytics
- Allowlisted, read-only admin dashboard for MRR, revenue, churn, users, plans, domains, video, and engagement
- Partner and white-label workspaces with team roles, connected Stripe Payment Links, athlete checkout routing, and wholesale seat billing
- White-label subdomain connection with `admin.` management, `builder.` editing, and athlete sites while preserving the partner's apex business website
- Landscape and vertical Remotion marketing-video compositions
- A new baseball-focused marketing and pricing homepage

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The builder is at `/builder`.

Signed-in players manage their portfolio at `/dashboard`. The legacy `/account`
address redirects there. Add one or more comma-separated owner emails to
`ADMIN_EMAILS` to allow access to the read-only `/admin` dashboard.

## Supabase

The linked project reference is `fyhfikfhusuaepsvzcui`. The database schema lives in:

```
supabase/migrations/
```

Apply it after authenticating and linking:

```bash
npx supabase login
npx supabase link --project-ref fyhfikfhusuaepsvzcui
npx supabase db push
```

Add `SUPABASE_SERVICE_ROLE_KEY` only to server-side deployment environment variables.

## Stripe

Local development must use Stripe test-mode credentials. Production must use live-mode credentials and the three recurring monthly price IDs in `.env.production.example`. Configure the webhook endpoint:

```
https://YOUR_DOMAIN/api/stripe/webhook
```

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Then set `STRIPE_WEBHOOK_SECRET`.

Enable the Stripe Customer Portal for subscription cancellation and plan management.

Partner billing uses Stripe Accounts v2 with Stripe-hosted Account Links. No
Connect OAuth client ID is required. Diamond Profile creates a V2 Account with
merchant and customer configurations, stores its `acct_` ID on the partner
organization, and reads onboarding/capability status directly from Stripe.

Create two Connect event destinations:

1. A snapshot destination for **events on connected accounts** at
   `/api/stripe/connect-webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, and `customer.subscription.deleted`. Store
   its signing secret as `STRIPE_CONNECT_WEBHOOK_SECRET`.
2. A **Thin** destination at `/api/stripe/connect-v2-webhook`, subscribed to
   `v2.core.account[requirements].updated`,
   `v2.core.account[configuration.merchant].capability_status_updated`,
   `v2.core.account[configuration.customer].capability_status_updated`,
   `v2.core.account.updated`, and `v2.core.account.closed`. Store its signing
   secret as `STRIPE_CONNECT_V2_WEBHOOK_SECRET`.

Partners create recurring Pro/Elite checkouts in their own connected account.
Athlete revenue remains in that account; Diamond Profile separately charges the
same V2 Account as a `customer_account` for wholesale seats.

## Production

Use `.env.production.example` as the Vercel Production environment checklist. Managed domains require the Vercel project identifier, registrar contact fields, a random `CRON_SECRET` of at least 16 characters, and a maximum purchase-price ceiling. Domain add-on activation creates a tracked registrar order, attaches it after Vercel confirms ownership, and enables renewal; cancellation disables renewal. A secured daily reconciliation job safely finishes any asynchronous registrar orders and works on every Vercel plan. Apply every migration before deploying:

```bash
npx supabase db push
npm run lint
npm run build
```

The Privacy Policy and Terms included in the app are launch baselines and should be reviewed by qualified counsel before accepting paying customers.

## Marketing videos

Preview compositions:

```bash
npm run remotion:studio
```

Render MP4 files:

```bash
npm run video:landscape
npm run video:vertical
```

Outputs are written to `out/`.

## Meta Ads measurement

Set `NEXT_PUBLIC_META_PIXEL_ID` to the numeric Pixel ID from Meta Events Manager. When it is unset, the tracking integration remains dormant. The app records:

- `PageView`, `ViewContent`, `Lead`, and `CompleteRegistration`
- `PortfolioStarted` and `PortfolioPublished` custom funnel events
- `InitiateCheckout`, `Subscribe`, and server-verified `Purchase` values

UTM parameters and `fbclid` persist in the browser and are attached to Stripe Checkout metadata for campaign attribution. The Privacy Policy discloses this measurement.
