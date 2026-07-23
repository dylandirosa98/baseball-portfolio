import Link from "next/link";

export const metadata = { title: "Privacy Policy | Diamond Profile" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-12 text-[#171717]">
      <article className="mx-auto max-w-3xl space-y-7 leading-7">
        <Link href="/" className="text-sm font-semibold">← Diamond Profile</Link>
        <div><h1 className="text-4xl font-black">Privacy Policy</h1><p className="mt-2 text-sm text-black/50">Effective July 23, 2026</p></div>
        <section><h2 className="text-xl font-bold">What we collect</h2><p>We collect account and billing information, player profile details, photos, videos, statistics, links, uploaded documents, and basic usage analytics needed to provide Diamond Profile. Public portfolios display the information the account holder chooses to publish.</p></section>
        <section><h2 className="text-xl font-bold">How we use information</h2><p>We use information to authenticate accounts, host and publish portfolios, process payments, provide video and domain services, prevent abuse, support customers, and improve the service. We do not sell account-holder or player email addresses or personal information to data brokers or advertisers.</p></section>
        <section><h2 className="text-xl font-bold">Service providers</h2><p>We use service providers including Supabase, Vercel, Stripe, Mux, and embedded-media providers. They process information only as needed to deliver their respective services and under their own privacy terms.</p></section>
        <section><h2 className="text-xl font-bold">Players and minors</h2><p>Accounts must be created by an adult player, parent, legal guardian, or authorized adult. Do not publish a minor&apos;s personal information without appropriate authority and consent. We do not knowingly permit children under 13 to create accounts themselves.</p></section>
        <section><h2 className="text-xl font-bold">Retention and deletion</h2><p>Information remains until it is removed by the account holder, the account is deleted, or retention is required for billing, fraud prevention, disputes, or law. Account holders can request access, correction, export, or deletion through the account page or support.</p></section>
        <section><h2 className="text-xl font-bold">Contact</h2><p>Privacy and deletion questions can be sent to <a className="underline" href="mailto:support@diamondprofile.app">support@diamondprofile.app</a>.</p></section>
      </article>
    </main>
  );
}
