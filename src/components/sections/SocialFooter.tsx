"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Mail } from "lucide-react";
import { SocialLink } from "@/lib/types";

interface SocialFooterProps {
  socialLinks: SocialLink[];
  lightMode?: boolean;
}

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  if (platform === "email") return <Mail className="h-5 w-5" />;
  return <ExternalLink className="h-5 w-5" />;
}

export default function SocialFooter({ socialLinks }: SocialFooterProps) {
  return (
    <footer className="px-5 pb-20 pt-12 lg:mx-auto lg:max-w-4xl lg:py-16">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {socialLinks.map((link, index) => (
            <motion.a
              key={`${link.platform}-${index}`}
              href={link.platform === "email" && !link.url.startsWith("mailto:") ? `mailto:${link.url}` : link.url}
              target={link.platform === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={link.platform}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
              whileTap={{ scale: 0.95 }}
            >
              <SocialIcon platform={link.platform} />
            </motion.a>
          ))}
        </div>
        <div className="mx-auto mb-6 h-px w-12 bg-white/10" />
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/35 transition hover:text-white/60">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 font-black">D</span>
          Made with Diamond Portfolio
        </Link>
      </motion.div>
    </footer>
  );
}
