"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail } from "lucide-react";
import { ProfileBranding, SocialLink } from "@/lib/types";

interface SocialFooterProps {
  socialLinks: SocialLink[];
  lightMode?: boolean;
  branding?: ProfileBranding;
}

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  if (platform === "email") return <Mail className="h-5 w-5" />;
  return <ExternalLink className="h-5 w-5" />;
}

export default function SocialFooter({ socialLinks, branding }: SocialFooterProps) {
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
        {branding?.hideDiamondBranding ? (
          <a href={branding.supportEmail ? `mailto:${branding.supportEmail}` : undefined} className="inline-flex items-center gap-2 text-xs font-semibold text-white/40 transition hover:text-white/65">
            {branding.logoUrl ? <Image src={branding.logoUrl} alt="" width={48} height={48} unoptimized className="h-9 w-9 object-contain" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: branding.primaryColor }} />}
            Managed by {branding.name}
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {branding && <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/25">Managed by {branding.name}</span>}
            <Link href="https://diamondprofile.app" className="inline-flex items-center gap-2 text-xs font-semibold text-white/35 transition hover:text-white/60">
              <Image src="/diamond-profile-logo.png" alt="" width={48} height={48} className="h-9 w-9 object-contain" />
              Made with Diamond Profile
            </Link>
          </div>
        )}
      </motion.div>
    </footer>
  );
}
