"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, LayoutDashboard, LoaderCircle, LogOut, PencilLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignedInMenu({ email, name }: { email: string; name?: string }) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const displayName = name?.trim() || email.split("@")[0] || "Account";
  const initial = displayName.charAt(0).toUpperCase();

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-1.5 pr-2.5 text-left transition hover:border-emerald-300/40 hover:bg-emerald-400/[0.12] [&::-webkit-details-marker]:hidden">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-black">
          {initial}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#18181b] bg-emerald-400" />
        </span>
        <span className="hidden min-w-0 max-w-32 sm:block">
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300"><Check className="h-2.5 w-2.5" /> Signed in</span>
          <span className="block truncate text-xs font-semibold text-white/85">{displayName}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-white/35 transition group-open:rotate-180 sm:block" />
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#18181b] p-2 shadow-[0_24px_70px_rgba(0,0,0,.55)]">
        <div className="border-b border-white/10 px-3 pb-3 pt-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Signed in</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-white/40">{email}</p>
        </div>
        <div className="py-2">
          <Link href="/dashboard" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white">
            <LayoutDashboard className="h-4 w-4 text-white/40" /> Dashboard
          </Link>
          <Link href="/builder?mode=edit&returnTo=%2Fdashboard" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white">
            <PencilLine className="h-4 w-4 text-white/40" /> Edit profile
          </Link>
        </div>
        <button type="button" onClick={() => void signOut()} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 border-t border-white/10 px-3 pt-2 text-sm font-semibold text-white/45 transition hover:text-white disabled:opacity-50">
          {signingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out
        </button>
      </div>
    </details>
  );
}
