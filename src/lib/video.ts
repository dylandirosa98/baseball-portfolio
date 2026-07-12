export type VideoInfo =
  | { platform: "youtube"; id: string }
  | { platform: "vimeo"; id: string }
  | { platform: "wistia"; id: string }
  | { platform: "mux"; id: string }
  | { platform: "gdrive-file"; id: string }
  | { platform: "gdrive-folder"; id: string }
  | { platform: "unknown" };

export function detectVideo(url: string): VideoInfo {
  // YouTube
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of ytPatterns) {
    const m = url.match(p);
    if (m) return { platform: "youtube", id: m[1] };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return { platform: "vimeo", id: vimeoMatch[1] };

  // Wistia
  const wistiaMatch = url.match(
    /(?:wistia\.com\/medias\/|wistia\.net\/embed\/iframe\/|wistia\.com\/embed\/iframe\/)([a-zA-Z0-9]+)/
  );
  if (wistiaMatch) return { platform: "wistia", id: wistiaMatch[1] };

  // Mux playback URLs
  const muxMatch = url.match(/(?:stream|player|image)\.mux\.com\/([a-zA-Z0-9_-]+)(?:\.m3u8|\/|$)/);
  if (muxMatch) return { platform: "mux", id: muxMatch[1] };

  // Google Drive folder
  const gdriveFolderMatch = url.match(/drive\.google\.com\/drive(?:\/u\/\d+)?\/folders\/([a-zA-Z0-9_-]+)/);
  if (gdriveFolderMatch) return { platform: "gdrive-folder", id: gdriveFolderMatch[1] };

  // Google Drive file
  const gdriveFileMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gdriveFileMatch) return { platform: "gdrive-file", id: gdriveFileMatch[1] };

  return { platform: "unknown" };
}

export function getEmbedUrl(video: VideoInfo): string | null {
  switch (video.platform) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
    case "vimeo":
      return `https://player.vimeo.com/video/${video.id}?autoplay=1&title=0&byline=0&portrait=0`;
    case "wistia":
      return `https://fast.wistia.net/embed/iframe/${video.id}?autoPlay=true&seo=true&videoFoam=false`;
    case "mux":
      return null;
    case "gdrive-file":
      return `https://drive.google.com/file/d/${video.id}/preview`;
    case "gdrive-folder":
      return `https://drive.google.com/embeddedfolderview?id=${video.id}#list`;
    default:
      return null;
  }
}

export function getMuxThumbnailUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?fit_mode=preserve`;
}

export function getMuxPlaybackId(url?: string, explicitPlaybackId?: string): string | null {
  if (explicitPlaybackId) return explicitPlaybackId;
  if (!url) return null;
  const video = detectVideo(url);
  return video.platform === "mux" ? video.id : null;
}

export function hasMediaSource(item: { url?: string; muxPlaybackId?: string }): boolean {
  return Boolean(item.url?.trim() || item.muxPlaybackId?.trim());
}
