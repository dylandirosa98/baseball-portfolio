import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToPlayer, PlayerRow } from "@/lib/supabase/transforms";
import { PROFILE_DOMAIN, profileUrl } from "@/lib/slug";
import PlayerTemplate from "@/components/PlayerTemplate";
import PortfolioAnalytics from "@/components/PortfolioAnalytics";
import type { Metadata } from "next";

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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) notFound();

  const hostname = await requestHostname();
  if (hostname === PROFILE_DOMAIN || hostname === `www.${PROFILE_DOMAIN}`) redirect(profileUrl(slug));

  const player = rowToPlayer(data as PlayerRow, { enforceEntitlements: true });

  return (
    <>
      <PortfolioAnalytics slug={player.slug} />
      <PlayerTemplate player={player} />
    </>
  );
}
