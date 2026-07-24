import Link from "next/link";

export const metadata = { title: "Support | Diamond Profile" };

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-white/50 hover:text-white">← Diamond Profile</Link>
        <h1 className="mt-8 text-4xl font-black">How can we help?</h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/55">Choose the address that best matches what you need. Both go directly to the Diamond Profile team.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Product support</p>
            <h2 className="mt-3 text-xl font-black">Profiles, accounts, and domains</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Get help with account access, publishing, videos, privacy, portfolio removal, or a custom domain.</p>
            <a href="mailto:support@diamondprofile.app?subject=Diamond%20Profile%20support" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-bold text-black">support@diamondprofile.app</a>
          </section>
          <section className="rounded-2xl border border-[#ff5965]/30 bg-[#ff5965]/[0.06] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7b85]">Billing support</p>
            <h2 className="mt-3 text-xl font-black">Payments and subscriptions</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Get help with charges, receipts, plan billing, cancellations, or subscription questions.</p>
            <a href="mailto:billing@diamondprofile.app?subject=Diamond%20Profile%20billing%20help" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#e01010] px-4 text-sm font-bold text-white">billing@diamondprofile.app</a>
          </section>
        </div>
        <p className="mt-6 text-sm leading-6 text-white/40">Include your account email and portfolio address so we can help faster. Never send a password or full payment-card number.</p>
        <div className="mt-12 flex gap-5 text-sm text-white/45"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </main>
  );
}
