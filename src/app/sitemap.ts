import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://diamondprofile.app";
  const homepage: MetadataRoute.Sitemap = [
    { url: origin, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return homepage;

  const { data } = await createAdminClient()
    .from("players")
    .select("slug, updated_at")
    .eq("is_published", true);

  return [
    ...homepage,
    ...(data ?? []).map((player) => ({
      url: origin + "/" + player.slug,
      lastModified: new Date(player.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
