type MuxRequestInit = RequestInit & { body?: BodyInit | null };

function getMuxAuthHeader() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error("Mux is not configured. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET.");
  }

  return `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`;
}

export async function muxRequest<T>(path: string, init: MuxRequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: {
      Authorization: getMuxAuthHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.messages?.join(" ") || payload?.error?.message || "Mux request failed";
    throw new Error(message);
  }

  return payload as T;
}

export function muxPlaybackUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function muxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?fit_mode=preserve`;
}

export async function deleteMuxAsset(assetId: string) {
  await muxRequest<unknown>(`/video/v1/assets/${assetId}`, {
    method: "DELETE",
  });
}
