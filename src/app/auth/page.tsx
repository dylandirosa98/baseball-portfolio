"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConsent, setAdultConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/builder`,
          data: {
            adult_account_holder: true,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });
      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }
      if (!data.session) {
        setState("sent");
        setMessage("Check your email to confirm your account. Your draft stays saved on this device.");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }
    }

    router.push(mode === "signup" ? "/builder" : "/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white sm:py-12">
      <div className="mx-auto max-w-md">
        <Link href="/builder" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>
        <Image src="/diamond-profile-logo.png" alt="Diamond Profile" width={180} height={180} className="mb-8 h-28 w-28 object-contain" priority />
        <h1 className="text-3xl font-bold">{mode === "signup" ? "Save your portfolio" : "Welcome back"}</h1>
        <p className="mt-2 text-sm leading-6 text-white/50">
          {mode === "signup" ? "Create an account to keep your work synced and edit from any device." : "Sign in to continue building your player portfolio."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/65">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-red-400" />
          </label>
          <label className="block text-sm text-white/65">
            Password
            <input required minLength={8} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-red-400" />
          </label>
          {mode === "signup" && (
            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/55">
              <input required type="checkbox" checked={adultConsent} onChange={(event) => setAdultConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-red-500" />
              <span>I am at least 18 years old and am the player, a parent or legal guardian, or an adult authorized to publish this player&apos;s information. I agree to the <Link href="/terms" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
            </label>
          )}
          <button disabled={state === "loading"} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-bold text-black disabled:opacity-60">
            {state === "loading" && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        {message && <p aria-live="polite" className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${state === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"}`}>{message}</p>}

        <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setState("idle"); }} className="mt-6 min-h-11 text-sm font-semibold text-white/55 hover:text-white">
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
        {mode === "signin" && <Link href="/auth/reset" className="mt-2 inline-flex min-h-11 items-center text-sm text-white/40 hover:text-white">Forgot your password?</Link>}
      </div>
    </main>
  );
}
