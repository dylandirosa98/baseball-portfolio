import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import PlayerTemplate from "@/components/PlayerTemplate";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import type { ProfileBranding } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio Preview | Diamond Profile Admin",
  robots: { index: false, follow: false },
};

type PreviewPageProps = {
  params: Promise<{ playerId: string }>;
};

type OrganizationRow = {
  name: string;
  logo_url: string | null;
  primary_color: string;
  support_email: string | null;
  hide_diamond_branding: boolean;
};

export default async function AdminPortfolioPreview({ params }: PreviewPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isPlatformAdmin(user.email)) notFound();

  const { playerId } = await params;
  const { data, error } = await createAdminClient()
    .from("players")
    .select("*, partner_organizations(name, logo_url, primary_color, support_email, hide_diamond_branding)")
    .eq("id", playerId)
    .single();
  if (error || !data) notFound();

  const player = rowToPlayer(data as PlayerRow, { enforceEntitlements: true });
  const organization = data.partner_organizations as unknown as OrganizationRow | null;
  const branding: ProfileBranding | undefined = organization ? {
    name: organization.name,
    logoUrl: organization.logo_url || undefined,
    primaryColor: organization.primary_color,
    supportEmail: organization.support_email || undefined,
    hideDiamondBranding: organization.hide_diamond_branding,
  } : undefined;

  return (
    <>
      <aside className="fixed inset-x-0 top-0 z-[100] border-b border-amber-200/30 bg-[#151008]/95 px-4 py-2 text-amber-50 shadow-xl backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Eye className="h-4 w-4 text-amber-300" />
            <strong>{player.isPublished ? "ADMIN PREVIEW" : "UNPUBLISHED DRAFT PREVIEW"}</strong>
            <span className="hidden text-amber-100/55 sm:inline">Viewing this does not publish or modify the portfolio.</span>
          </div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-100/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to admin
          </Link>
        </div>
      </aside>
      <div className="pt-10">
        <PlayerTemplate player={player} branding={branding} />
      </div>
    </>
  );
}
