import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToPlayer, PlayerRow } from "@/lib/supabase/transforms";
import PlayerTemplate from "@/components/PlayerTemplate";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("first_name, last_name, position, team")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Player Not Found" };

  return {
    title: `${data.first_name} ${data.last_name} | ${data.position} - ${data.team}`,
    description: `${data.first_name} ${data.last_name} — ${data.position} for ${data.team}`,
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

  const player = rowToPlayer(data as PlayerRow);

  return <PlayerTemplate player={player} />;
}
