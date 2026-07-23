import Link from "next/link";

export const metadata = { title: "Terms of Service | Diamond Profile" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-12 text-[#171717]">
      <article className="mx-auto max-w-3xl space-y-7 leading-7">
        <Link href="/" className="text-sm font-semibold">← Diamond Profile</Link>
        <div><h1 className="text-4xl font-black">Terms of Service</h1><p className="mt-2 text-sm text-black/50">Effective July 23, 2026</p></div>
        <section><h2 className="text-xl font-bold">Account authority</h2><p>You must be at least 18 and be the player, a parent or legal guardian, or an adult authorized to publish the player&apos;s information. You are responsible for the accuracy of profile content and for having permission to upload and publish it.</p></section>
        <section><h2 className="text-xl font-bold">Subscriptions</h2><p>Free hosting does not require payment. Pro, Elite, and Custom Domain subscriptions renew monthly until canceled. Plan changes and cancellations are managed through the billing portal. Except where required by law, subscription charges already incurred are non-refundable.</p></section>
        <section><h2 className="text-xl font-bold">Custom domains</h2><p>The Custom Domain add-on covers one eligible standard-priced .com selected during signup. Diamond Profile owns, registers, connects, renews, and manages the domain while the add-on remains active. Premium-priced or unavailable names are excluded. Domain registration and renewal purchases are final. When the add-on ends, the domain may be disconnected and auto-renewal disabled; continued ownership or transfer is not guaranteed unless separately agreed in writing.</p></section>
        <section><h2 className="text-xl font-bold">Acceptable use</h2><p>Do not upload unlawful, infringing, deceptive, abusive, explicit, malicious, or unauthorized content. Do not probe the service, evade limits, impersonate another person, or interfere with other users.</p></section>
        <section><h2 className="text-xl font-bold">Hosted media</h2><p>Paid video capacity is subject to plan limits and reasonable fair-use safeguards. Paid hosted media may be disabled after downgrade or cancellation and deleted after a reasonable retention period. Keep original copies of all media.</p></section>
        <section><h2 className="text-xl font-bold">Service availability</h2><p>We work to keep Diamond Profile available, but do not guarantee uninterrupted operation, recruiting outcomes, domain availability, or permanent storage. Features may change to protect reliability, security, and legal compliance.</p></section>
        <section><h2 className="text-xl font-bold">Contact</h2><p>Questions can be sent to <a className="underline" href="mailto:support@diamondprofile.app">support@diamondprofile.app</a>.</p></section>
      </article>
    </main>
  );
}
