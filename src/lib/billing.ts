import type { MediaItem, Player } from "@/lib/types";

export type BillingTier = "free" | "pro" | "elite";

export const BILLING_LIMITS = {
  free: { images: 10, embeddedVideos: 5, muxVideos: 0 },
  pro: { images: 25, embeddedVideos: 25, muxVideos: 10 },
  elite: { images: Number.POSITIVE_INFINITY, embeddedVideos: Number.POSITIVE_INFINITY, muxVideos: Number.POSITIVE_INFINITY },
} as const;

function present(value?: string) {
  return Boolean(value && !value.includes("placeholder"));
}

function contentMedia(player: Partial<Player>) {
  return [
    ...(player.media ?? []),
    ...(player.interestsMedia ?? []),
    ...((player.timeline ?? []).flatMap((entry) => entry.media ?? [])),
    ...((player.skillsets ?? []).flatMap((skill) => skill.videos ?? [])),
  ];
}

function muxVideo(item: { muxPlaybackId?: string; muxAssetId?: string; muxUploadId?: string }) {
  return Boolean(item.muxPlaybackId || item.muxAssetId || item.muxUploadId);
}

export function portfolioUsage(player: Partial<Player>) {
  const media = contentMedia(player);
  const imageUrls = [
    player.headshotUrl,
    player.heroImageUrl,
    player.teamLogoUrl,
    ...media.filter((item) => item.type === "photo").map((item) => item.url),
  ].filter(present);

  const videoItems: Array<MediaItem | NonNullable<Player["highlights"]>[number] | NonNullable<Player["trainingVideos"]>[number]> = [
    ...media.filter((item) => item.type === "video"),
    ...(player.highlights ?? []),
    ...(player.trainingVideos ?? []),
  ];
  const standaloneVideos = [
    player.highlightReelUrl,
    player.trainingVideoUrl,
    ...(player.skillsets ?? []).map((skill) => skill.watchUrl),
  ].filter((url): url is string => Boolean(url));

  return {
    images: new Set(imageUrls).size,
    muxVideos: videoItems.filter(muxVideo).length,
    embeddedVideos: videoItems.filter((item) => present(item.url) && !muxVideo(item)).length + new Set(standaloneVideos).size,
  };
}

export function quotaError(player: Partial<Player>, tier: BillingTier) {
  const usage = portfolioUsage(player);
  const limits = BILLING_LIMITS[tier];

  if (usage.images > limits.images) {
    return tier === "free"
      ? "Free portfolios include up to 10 images. Upgrade to Pro for up to 25."
      : "Pro portfolios include up to 25 images. Upgrade to Elite for fair-use unlimited images.";
  }
  if (usage.embeddedVideos > limits.embeddedVideos) {
    return tier === "free"
      ? "Free portfolios include up to 5 embedded videos. Upgrade to Pro to add more."
      : "Pro portfolios include up to 25 embedded videos. Upgrade to Elite for fair-use unlimited embeds.";
  }
  if (usage.muxVideos > limits.muxVideos) {
    return tier === "free"
      ? "Professional in-app video uploads require Pro or Elite. Free portfolios can use YouTube embeds."
      : "Pro includes up to 10 professionally hosted video uploads. Upgrade to Elite for fair-use unlimited in-app video uploads.";
  }

  return null;
}
