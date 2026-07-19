export const DEFAULT_PLAYER_IMAGE = "/images/player-placeholder.png";

export function isPlaceholderPlayerImage(url?: string) {
  return !url?.trim() || url.includes("placeholder");
}

export function playerImageOrFallback(url?: string) {
  return isPlaceholderPlayerImage(url) ? DEFAULT_PLAYER_IMAGE : url!;
}

export function normalizedHeroImageScale(url?: string, scale?: number) {
  const fallback = isPlaceholderPlayerImage(url) ? 120 : 100;
  const value = typeof scale === "number" && Number.isFinite(scale) ? scale : fallback;
  return Math.min(150, Math.max(80, value));
}
