"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.replace("/account");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">Choose a new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 outline-none focus:border-red-400" />
          <button disabled={loading} className="min-h-12 w-full rounded-lg bg-white px-4 font-bold text-black disabled:opacity-60">{loading ? "Updating…" : "Update password"}</button>
        </form>
        {message && <p role="alert" className="mt-4 text-sm text-red-300">{message}</p>}
      </div>
    </main>
  );
}
