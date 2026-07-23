"use client";

import { useEffect } from "react";

type PortfolioMetric = "profile_view" | "video_play";

async function record(slug: string, metric: PortfolioMetric) {
  await fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, metric }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function PortfolioAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    const key = "diamond_profile_view:" + slug + ":" + day;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      void record(slug, "profile_view");
    }

    const onVideoPlay = () => void record(slug, "video_play");
    window.addEventListener("diamond:video-play", onVideoPlay);
    return () => window.removeEventListener("diamond:video-play", onVideoPlay);
  }, [slug]);

  return null;
}
