import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: player } = await supabase
    .from("players")
    .select("id, slug, is_published, billing_tier, has_custom_domain, subscription_status, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const analyticsEnabled = player?.billing_tier === "pro" || player?.billing_tier === "elite";
  let profileViews = 0;
  let videoPlays = 0;
  if (analyticsEnabled && player?.id) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 29);
    const { data: analytics } = await supabase
      .from("portfolio_analytics_daily")
      .select("profile_views, video_plays")
      .eq("player_id", player.id)
      .gte("day", since.toISOString().slice(0, 10));

    profileViews = (analytics ?? []).reduce((sum, row) => sum + Number(row.profile_views), 0);
    videoPlays = (analytics ?? []).reduce((sum, row) => sum + Number(row.video_plays), 0);
  }

  async function manageBilling() {
    "use server";
    const client = await createClient();
    const { data: { user: billingUser } } = await client.auth.getUser();
    if (!billingUser) redirect("/auth");
    const { data: billingPlayer } = await client.from("players").select("stripe_customer_id").eq("user_id", billingUser.id).maybeSingle();
    if (!billingPlayer?.stripe_customer_id) redirect("/account");
    const session = await getStripe().billingPortal.sessions.create({
      customer: billingPlayer.stripe_customer_id,
      return_url: getAppUrl() + "/account",
    });
    redirect(session.url);
  }

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        <Image src="/diamond-profile-logo.png" alt="Diamond Profile" width={180} height={180} className="mb-8 h-28 w-28 object-contain" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Account</p>
        <h1 className="mt-2 text-3xl font-bold">{user.email}</h1>
        <div className="mt-8 grid gap-3">
          <Link href="/builder" className="flex min-h-14 items-center justify-between rounded-lg bg-white px-4 font-bold text-black">
            Edit portfolio <ArrowRight className="h-4 w-4" />
          </Link>
          {player?.is_published && (
            <Link href={"/" + player.slug} className="flex min-h-14 items-center justify-between rounded-lg border border-white/10 px-4 font-semibold">
              View live portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/50">
          <p>Plan: {player?.billing_tier === "elite" ? "Elite" : player?.billing_tier === "pro" ? "Pro" : "Free"}</p>
          <p className="mt-1">Custom domain: {player?.has_custom_domain ? "Active" : "Not added"}</p>
          <p className="mt-1">Status: {player?.subscription_status || "Draft"}</p>
        </div>

        {analyticsEnabled ? (
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-widest text-white/35">Analytics</p><h2 className="mt-1 text-lg font-bold">Last 30 days</h2></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold">{profileViews.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white/40">Portfolio views</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-2xl font-bold">{videoPlays.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white/40">Video plays</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="mt-8 rounded-lg border border-white/10 p-4 text-sm text-white/45">
            Upgrade to Pro for portfolio-view and video-play analytics.
          </div>
        )}

        {player?.stripe_customer_id && (
          <form action={manageBilling} className="mt-8">
            <button className="min-h-11 rounded-lg border border-white/15 px-4 text-sm font-semibold hover:bg-white/5">Manage billing</button>
          </form>
        )}
        <form action={signOut} className="mt-8">
          <button className="min-h-11 text-sm font-semibold text-white/50 hover:text-white">Sign out</button>
        </form>
        <DeleteAccountButton />
      </div>
    </main>
  );
}
