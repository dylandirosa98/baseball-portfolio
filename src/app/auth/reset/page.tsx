"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    setLoading(false);
    setMessage(error ? error.message : "If an account exists for that email, a password-reset link is on its way.");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/auth" className="text-sm text-white/50 hover:text-white">← Back to sign in</Link>
        <h1 className="mt-8 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-white/50">Enter the email used for your Diamond Profile account.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 outline-none focus:border-red-400" />
          <button disabled={loading} className="min-h-12 w-full rounded-lg bg-white px-4 font-bold text-black disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}</button>
        </form>
        {message && <p aria-live="polite" className="mt-4 rounded-lg border border-white/10 p-3 text-sm text-white/65">{message}</p>}
      </div>
    </main>
  );
}
