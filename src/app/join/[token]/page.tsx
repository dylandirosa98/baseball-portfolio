import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, LockKeyhole } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import AthleteInvitationAccess from "@/components/partner/AthleteInvitationAccess";
import PlayerTemplate from "@/components/PlayerTemplate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { claimPartnerInvitations, partnerAccess, partnerSubscriptionEntitled } from "@/lib/partners";
import { rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import type { ProfileBranding } from "@/lib/types";
import { getAppUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Player profile invitation", robots: { index: false, follow: false } };

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
}

export default async function AthleteJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const result = await admin.from("partner_invitations")
    .select("*,players(*,partner_profile_checkouts(token,active)),partner_organizations(*)")
    .eq("token", token).eq("role", "athlete").maybeSingle();
  if (result.error || !result.data) notFound();
  const invitation = result.data as unknown as {
    id: string; email: string; status: string; expires_at: string; athlete_creation_mode: "athlete_builds" | "organization_builds";
    players: (PlayerRow & { id: string; partner_billing_source: string; partner_billing_status: string; partner_profile_checkouts: Array<{ token: string; active: boolean }> }) | null;
    partner_organizations: { id: string; name: string; partnership_type: string; status: string; logo_url: string | null; primary_color: string; support_email: string | null; hide_diamond_branding: boolean } | null;
  };
  if (!invitation.players || !invitation.partner_organizations || invitation.partner_organizations.status !== "active" || ["revoked", "expired"].includes(invitation.status)) notFound();
  const organization = invitation.partner_organizations;
  const isWhiteLabel = organization.partnership_type === "white_label";
  const brandName = isWhiteLabel ? organization.name : "Diamond Profile";
  const brandColor = isWhiteLabel ? organization.primary_color : "#e11d2e";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-4 py-12 text-white" style={{ "--brand": brandColor } as React.CSSProperties}>
        <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#111216] shadow-2xl">
          <div className="h-1.5 bg-[var(--brand)]" />
          <div className="p-7 sm:p-10">
            {isWhiteLabel && organization.logo_url ? <Image src={organization.logo_url} alt={brandName} width={72} height={72} unoptimized className="mb-7 h-16 w-16 object-contain" /> : <Image src="/diamond-profile-logo.png" alt="Diamond Profile" width={72} height={72} className="mb-7 h-16 w-16 object-contain" />}
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/35">Invitation from {organization.name}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{invitation.athlete_creation_mode === "organization_builds" ? "Your profile is ready to review." : "Your player profile starts here."}</h1>
            <p className="mt-4 text-sm leading-7 text-white/50">For privacy, this invitation can only be claimed by <strong className="text-white/75">{maskEmail(invitation.email)}</strong>. We will send a short-lived sign-in link to that address.</p>
            <div className="mt-7"><AthleteInvitationAccess token={token} color={brandColor} /></div>
            <p className="mt-6 flex gap-2 text-xs leading-5 text-white/30"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />The permanent invitation URL never signs someone in by itself. Access is verified through the invited email.</p>
          </div>
        </section>
      </main>
    );
  }

  const organizationAccess = await partnerAccess(user.id, organization.id);
  const isOrganizationUser = Boolean(organizationAccess);
  if (!isOrganizationUser && (!user.email || user.email.toLowerCase() !== invitation.email.toLowerCase())) {
    return <main className="flex min-h-screen items-center justify-center bg-[#08090b] p-6 text-white"><div className="max-w-md rounded-2xl border border-red-400/20 bg-red-400/10 p-7"><h1 className="text-xl font-black">This invitation belongs to a different email</h1><p className="mt-3 text-sm leading-6 text-white/60">Sign out and use the secure link sent to {maskEmail(invitation.email)}.</p><Link href="/account" className="mt-5 inline-flex rounded-lg bg-white px-4 py-3 text-sm font-bold text-black">Open account settings</Link></div></main>;
  }

  if (!isOrganizationUser) await claimPartnerInvitations(user);
  if (invitation.athlete_creation_mode === "athlete_builds") {
    const returnTo = isOrganizationUser ? `/partner/${organization.id}` : "/dashboard";
    redirect(`/builder?mode=edit&playerId=${invitation.players.id}&returnTo=${encodeURIComponent(returnTo)}&partnerInvite=1`);
  }

  const player = rowToPlayer(invitation.players, { enforceEntitlements: true });
  const branding: ProfileBranding | undefined = isWhiteLabel ? {
    name: organization.name,
    logoUrl: organization.logo_url || undefined,
    primaryColor: organization.primary_color,
    supportEmail: organization.support_email || undefined,
    hideDiamondBranding: organization.hide_diamond_branding,
  } : undefined;
  const checkout = invitation.players.partner_profile_checkouts?.find((item) => item.active);
  const entitled = partnerSubscriptionEntitled(invitation.players.partner_billing_status) || invitation.players.partner_billing_status === "canceling";

  return (
    <main className="bg-black">
      <aside className="sticky top-0 z-[120] border-b border-white/10 bg-[#0b0c0f]/95 px-4 py-3 text-white shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4" /><div><strong>Private draft preview</strong><p className="text-xs text-white/40">Review the profile {organization.name} prepared for you.</p></div></div>
          {entitled ? <a href={`${getAppUrl()}/dashboard`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-black">Open dashboard <ArrowRight className="h-4 w-4" /></a> : checkout ? <Link href={`/p/${checkout.token}`} style={{ backgroundColor: brandColor }} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black text-white">Continue to secure checkout <ArrowRight className="h-4 w-4" /></Link> : <span className="text-xs text-amber-200">Ask {organization.name} to activate billing.</span>}
        </div>
      </aside>
      <PlayerTemplate player={player} branding={branding} />
    </main>
  );
}
