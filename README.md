# baseball-portfolio

A mobile-first builder for baseball players and families to create a polished recruiting website with one shareable link.

## Included

- Seven-step phone-friendly portfolio builder with live preview and local autosave
- Baseball positions, bats/throws, and position-specific hitting or pitching stats
- Photos, background removal, video, training, academics, social links, and player story
- Supabase email/password authentication and cloud portfolio sync
- Owner-scoped row-level security and media storage
- Stripe Checkout scaffolding for $29 Standard and $39 Premium subscriptions
- Signed Stripe webhook that publishes or unpublishes profiles as subscription status changes
- Premium custom-domain search through Vercel
- Landscape and vertical Remotion marketing-video compositions
- A new baseball-focused marketing and pricing homepage

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The builder is at `/builder`.

## Supabase

The linked project reference is `fyhfikfhusuaepsvzcui`. The database schema lives in:

```
supabase/migrations/20260711000000_initial_schema.sql
```

Apply it after authenticating and linking:

```bash
npx supabase login
npx supabase link --project-ref fyhfikfhusuaepsvzcui
npx supabase db push
```

Add `SUPABASE_SERVICE_ROLE_KEY` only to server-side deployment environment variables.

## Stripe

Create two recurring monthly prices and add their IDs to `.env.local`. Configure the webhook endpoint:

```
https://YOUR_DOMAIN/api/stripe/webhook
```

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Then set `STRIPE_WEBHOOK_SECRET`.

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
