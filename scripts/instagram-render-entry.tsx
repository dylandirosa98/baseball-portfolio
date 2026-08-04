import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { InstagramArtwork } from "../src/components/admin/AdminContentStudio";
import { instagramCarousels } from "../src/lib/instagram-content";

const mimeTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function inlineImages(svg: string) {
  const matches = [...svg.matchAll(/href="(\/[^"]+)"/g)];
  let result = svg;
  for (const [, source] of matches) {
    const file = path.join(process.cwd(), "public", source);
    const data = await readFile(file);
    const mime = mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream";
    result = result.replaceAll(`href="${source}"`, `href="data:${mime};base64,${data.toString("base64")}"`);
  }
  return result;
}

export async function renderCarousels() {
  return Promise.all(instagramCarousels.map(async (carousel) => ({
    ...carousel,
    svgs: await Promise.all(carousel.slides.map((slide, index) => inlineImages(
      renderToStaticMarkup(<InstagramArtwork slide={slide} index={index} total={carousel.slides.length} />),
    ))),
  })));
}
