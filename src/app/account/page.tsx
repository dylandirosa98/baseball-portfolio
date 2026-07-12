import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: player } = await supabase.from("players").select("slug, is_published, plan, subscription_status").eq("user_id", user.id).maybeSingle();

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        <Image src="/brand-placeholder.svg" alt="Diamond Portfolio" width={240} height={48} className="mb-10 h-10 w-auto invert" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Account</p>
        <h1 className="mt-2 text-3xl font-bold">{user.email}</h1>
        <div className="mt-8 grid gap-3">
          <Link href="/builder" className="flex min-h-14 items-center justify-between rounded-lg bg-white px-4 font-bold text-black">
            Edit portfolio <ArrowRight className="h-4 w-4" />
          </Link>
          {player?.is_published && (
            <Link href={`/${player.slug}`} className="flex min-h-14 items-center justify-between rounded-lg border border-white/10 px-4 font-semibold">
              View live portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/50">
          <p>Plan: {player?.plan || "No active plan"}</p>
          <p className="mt-1">Status: {player?.subscription_status || "Draft"}</p>
        </div>
        <form action={signOut} className="mt-8">
          <button className="min-h-11 text-sm font-semibold text-white/50 hover:text-white">Sign out</button>
        </form>
      </div>
    </main>
  );
}
