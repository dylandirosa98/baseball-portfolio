import Link from "next/link";

export const metadata = { title: "Support | Diamond Profile" };

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-white/50 hover:text-white">← Diamond Profile</Link>
        <h1 className="mt-8 text-4xl font-black">How can we help?</h1>
        <p className="mt-4 leading-7 text-white/55">For account access, billing, privacy, portfolio removal, video, or custom-domain help, email us. Include the account email and portfolio address, but never send a password or full payment-card number.</p>
        <a href="mailto:support@diamondprofile.app" className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-white px-5 font-bold text-black">support@diamondprofile.app</a>
        <div className="mt-12 flex gap-5 text-sm text-white/45"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </main>
  );
}
