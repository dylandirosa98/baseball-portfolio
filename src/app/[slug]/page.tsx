import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToPlayer, PlayerRow } from "@/lib/supabase/transforms";
import { PROFILE_DOMAIN, profileUrl } from "@/lib/slug";
import { partnerPlayerHostname } from "@/lib/domain-name";
import PlayerTemplate from "@/components/PlayerTemplate";
import PortfolioAnalytics from "@/components/PortfolioAnalytics";
import type { Metadata } from "next";
import type { ProfileBranding } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function requestHostname() {
  const requestHeaders = await headers();
  return (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0];
}

async function canonicalUrl(slug: string) {
  const hostname = await requestHostname();
  const isPreviewOrLocal = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".vercel.app");
  const isPlatformApex = hostname === PROFILE_DOMAIN || hostname === `www.${PROFILE_DOMAIN}`;
  if (hostname && !isPreviewOrLocal && !isPlatformApex) return `https://${hostname}`;
  return profileUrl(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("first_name, last_name, position, team, hero_image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Player Not Found", robots: { index: false, follow: false } };

  const url = await canonicalUrl(slug);
  const title = `${data.first_name} ${data.last_name} | ${data.position} - ${data.team}`;
  const description = `${data.first_name} ${data.last_name} — ${data.position} for ${data.team}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: data.hero_image_url ? [{ url: data.hero_image_url }] : undefined,
    },
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("players")
    .select("*, partner_organizations(name, logo_url, primary_color, support_email, hide_diamond_branding, status, profile_domain, profile_domain_status)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) notFound();
  const organization = data.partner_organizations as unknown as { name: string; logo_url: string | null; primary_color: string; support_email: string | null; hide_diamond_branding: boolean; status: string; profile_domain: string | null; profile_domain_status: string } | null;
  if (organization && organization.status !== "active") notFound();
  // Partner profiles are entitled either through the partner's wholesale seat
  // or through a connected-account customer subscription. Keep this check at
  // render time as a defense-in-depth fallback if a webhook is delayed.
  if (organization && !["trialing", "active", "past_due", "canceling"].includes(String((data as Record<string, unknown>).partner_billing_status))) {
    notFound();
  }

  const hostname = await requestHostname();
  if (organization?.profile_domain && organization.profile_domain_status === "active") {
    const expectedSuffix = `.${organization.profile_domain}`;
    const isPartnerHost = hostname === organization.profile_domain || hostname.endsWith(expectedSuffix);
    if (!isPartnerHost) redirect(`https://${partnerPlayerHostname(slug, organization.profile_domain)}`);
  }
  if (hostname === PROFILE_DOMAIN || hostname === `www.${PROFILE_DOMAIN}`) redirect(profileUrl(slug));

  const player = rowToPlayer(data as PlayerRow, { enforceEntitlements: true });
  const branding: ProfileBranding | undefined = organization ? {
    name: organization.name,
    logoUrl: organization.logo_url || undefined,
    primaryColor: organization.primary_color,
    supportEmail: organization.support_email || undefined,
    hideDiamondBranding: organization.hide_diamond_branding,
  } : undefined;

  return (
    <>
      <PortfolioAnalytics slug={player.slug} />
      <PlayerTemplate player={player} branding={branding} />
    </>
  );
}
