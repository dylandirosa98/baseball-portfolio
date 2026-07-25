export function managedApiPath(path: string) {
  if (typeof window === "undefined") return path;
  const playerId = new URLSearchParams(window.location.search).get("playerId");
  if (!playerId) return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set("playerId", playerId);
  return url.pathname + url.search;
}
