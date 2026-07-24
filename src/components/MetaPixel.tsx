"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureMarketingAttribution } from "@/lib/marketing-attribution";

type QueuedPixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

function installPixel(pixelId: string) {
  if (!window.fbq) {
    const pixel: QueuedPixel = (...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue?.push(args);
    };
    pixel.queue = [];
    pixel.loaded = true;
    pixel.version = "2.0";
    window.fbq = pixel;
    window._fbq = pixel;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq?.("init", pixelId);
}

export default function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const lastPageView = useRef("");

  useEffect(() => {
    const search = searchParams.toString();
    captureMarketingAttribution(search);
    if (!pixelId || !/^\d+$/.test(pixelId)) return;
    if (!initialized.current) {
      installPixel(pixelId);
      initialized.current = true;
    }
    const pageKey = pathname + (search ? "?" + search : "");
    if (lastPageView.current !== pageKey) {
      window.fbq?.("track", "PageView");
      lastPageView.current = pageKey;
    }
  }, [pathname, pixelId, searchParams]);

  return null;
}
