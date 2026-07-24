"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMarketingAttribution, trackMetaEvent } from "@/lib/marketing-attribution";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const callbackFailed = searchParams.has("error");
  const [mode, setMode] = useState<"signin" | "signup">(requestedMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConsent, setAdultConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(callbackFailed ? "error" : "idle");
  const [message, setMessage] = useState(callbackFailed ? "That sign-in attempt could not be completed. Please try again." : "");
  const [loadingAction, setLoadingAction] = useState<"email" | "google" | null>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup" && !adultConsent) {
      setState("error");
      setMessage("Confirm the account-holder agreement before creating an account.");
      return;
    }
    setState("loading");
    setLoadingAction("email");
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      trackMetaEvent("Lead", { content_name: "Diamond Profile signup" });
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/builder?signup=1");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: {
            adult_account_holder: true,
            terms_accepted_at: new Date().toISOString(),
            marketing_attribution: getMarketingAttribution(),
          },
        },
      });
      if (error) {
        setState("error");
        setMessage(error.message);
        setLoadingAction(null);
        return;
      }
      if (!data.session) {
        setState("sent");
        setMessage("Check your email to confirm your account. Your draft stays saved on this device.");
        setLoadingAction(null);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setState("error");
        setMessage(error.message);
        setLoadingAction(null);
        return;
      }
    }

    router.push(mode === "signup" ? "/builder?signup=1" : "/dashboard");
    router.refresh();
  }

  async function continueWithGoogle() {
    if (mode === "signup" && !adultConsent) {
      setState("error");
      setMessage("Confirm the account-holder agreement before continuing.");
      return;
    }

    setState("loading");
    setLoadingAction("google");
    setMessage("");
    if (mode === "signup") {
      trackMetaEvent("Lead", { content_name: "Diamond Profile Google signup" });
    }
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", mode === "signup" ? "/builder?signup=1" : "/dashboard");
    callback.searchParams.set("consent", "adult");

    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setState("error");
      setLoadingAction(null);
      setMessage(`Google sign-in could not start. ${error.message}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white sm:py-12">
      <div className="mx-auto max-w-md">
        <Link href={mode === "signup" ? "/builder" : "/"} className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {mode === "signup" ? "Back to builder" : "Back to home"}
        </Link>
        <Image src="/diamond-profile-logo.png" alt="Diamond Profile" width={180} height={180} className="mb-8 h-28 w-28 object-contain" priority />
        <h1 className="text-3xl font-bold">{mode === "signup" ? "Save your portfolio" : "Welcome back"}</h1>
        <p className="mt-2 text-sm leading-6 text-white/50">
          {mode === "signup" ? "Create an account to keep your work synced and edit from any device." : "Sign in to continue building your player portfolio."}
        </p>

        {mode === "signup" && (
          <label className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/55">
            <input type="checkbox" checked={adultConsent} onChange={(event) => setAdultConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-red-500" />
            <span>I am at least 18 years old and am the player, a parent or legal guardian, or an adult authorized to publish this player&apos;s information. I agree to the <Link href="/terms" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
          </label>
        )}

        <div className="mt-6">
          <button type="button" onClick={() => void continueWithGoogle()} disabled={state === "loading"} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-white px-4 font-semibold text-black transition hover:bg-white/90 disabled:opacity-60">
            {loadingAction === "google" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </button>
        </div>
        {mode === "signin" && (
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-white/35">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>By continuing, you confirm you are an authorized adult account holder and agree to the <Link href="/terms" className="underline hover:text-white/60">Terms</Link> and <Link href="/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.</span>
          </p>
        )}

        <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25"><span className="h-px flex-1 bg-white/10" /> or use email <span className="h-px flex-1 bg-white/10" /></div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm text-white/65">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-red-400" />
          </label>
          <label className="block text-sm text-white/65">
            Password
            <input required minLength={8} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-base outline-none focus:border-red-400" />
          </label>
          <button disabled={state === "loading"} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 font-bold text-black disabled:opacity-60">
            {loadingAction === "email" && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        {message && <p aria-live="polite" className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${state === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"}`}>{message}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
          <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setState("idle"); setLoadingAction(null); }} className="min-h-11 text-sm font-semibold text-white/55 hover:text-white">
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
          {mode === "signin" && <Link href="/auth/reset" className="inline-flex min-h-11 items-center text-sm text-white/40 hover:text-white">Forgot your password?</Link>}
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0a0a]" />}>
      <AuthContent />
    </Suspense>
  );
}
