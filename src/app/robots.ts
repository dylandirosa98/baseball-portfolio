import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://diamondprofile.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/api/", "/auth", "/builder"],
    },
    sitemap: origin + "/sitemap.xml",
  };
}
