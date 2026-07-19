"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Player } from "@/lib/types";
import VideoModal from "@/components/VideoModal";
import PdfModal from "@/components/PdfModal";
import { detectVideo } from "@/lib/video";
import { isPlaceholderPlayerImage, normalizedHeroImageScale, playerImageOrFallback } from "@/lib/player-image";

function blendColor(hex: string, opacity: number, bgBase = 10): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const br = Math.round(bgBase + (r - bgBase) * opacity);
  const bgr = Math.round(bgBase + (g - bgBase) * opacity);
  const bb = Math.round(bgBase + (b - bgBase) * opacity);
  return `#${br.toString(16).padStart(2, "0")}${bgr.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

interface HeroSectionProps {
  player: Player;
}

const heroSocialMeta = {
  ncsa: {
    label: "NCSA",
    logo: "/ncsa-logo.svg",
    mask: true,
  },
  hudl: {
    label: "HUDL",
    logo: "/hudl-logo.png",
    mask: false,
  },
} as const;

type HeroSocialPlatform = keyof typeof heroSocialMeta;

function isHeroSocialPlatform(platform: Player["socialLinks"][number]["platform"]): platform is HeroSocialPlatform {
  return platform in heroSocialMeta;
}

export default function HeroSection({ player }: HeroSectionProps) {
  const [showReel, setShowReel] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const defaultHeroImage = isPlaceholderPlayerImage(player.heroImageUrl);
  const heroImageScale = normalizedHeroImageScale(player.heroImageUrl, player.heroImageScale);
  const reelVideo = player.highlightReelUrl ? detectVideo(player.highlightReelUrl) : null;
  const isGdrive = reelVideo?.platform === "gdrive-folder" || reelVideo?.platform === "gdrive-file";
  const bgBase = player.lightMode ? 240 : 10;
  const bgHex = player.lightMode ? "#f0f0f0" : "#0a0a0a";
  const topColor = blendColor(player.themeColor, player.lightMode ? 0.55 : 0.251, bgBase);
  const midColor = blendColor(player.themeColor, player.lightMode ? 0.3 : 0.125, bgBase);

  return (
    <>
      <section className="design-one-hero relative min-h-[50svh] lg:min-h-[75vh] flex items-end overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Gradient background — solid block at top matches theme-color exactly, then fades */}
        <div
          className="absolute inset-0"
          style={{
            top: "calc(-1 * env(safe-area-inset-top, 0px))",
            background: `linear-gradient(to bottom, ${topColor} 0px, ${topColor} 44px, ${midColor} 40%, ${bgHex} 100%)`,
          }}
        />

        {/* Player cutout image */}
        <motion.div
          className="design-one-hero-image-wrap absolute inset-0 flex items-end justify-center lg:justify-end pointer-events-none"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="design-one-hero-image relative w-full max-w-[440px] lg:max-w-[520px] xl:max-w-[580px] h-[95%] lg:mr-[10%] xl:mr-[15%]">
            <Image
              src={playerImageOrFallback(player.heroImageUrl)}
              alt={`${player.firstName} ${player.lastName}`}
              fill
              className={"object-contain object-bottom" + (defaultHeroImage ? " default-player-image" : "")}
              style={{ transform: "scale(" + heroImageScale / 100 + ")", transformOrigin: "bottom center" }}
              priority
            />
          </div>
        </motion.div>

        {/* Bottom gradient fade over the player image */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: `linear-gradient(to top, ${bgHex}, ${bgHex}cc, transparent)` }}
        />

        {/* Diagonal gradient — strong at bottom-left (names), fades to transparent top-right (player visible) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to top right, ${bgHex}e6 0%, ${bgHex}bb 20%, ${bgHex}66 45%, ${bgHex}22 65%, transparent 85%)` }}
        />

        {/* Content */}
        <div className="design-one-hero-content relative w-full px-5 pb-10 pt-20 z-10 lg:max-w-5xl lg:mx-auto lg:px-10 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Number */}
            <motion.span
              className="design-one-hero-number text-[8rem] lg:text-[12rem] leading-none font-black absolute -bottom-2 right-2 lg:right-7 select-none"
              style={{ color: player.numberColor || player.themeColor }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: player.lightMode ? 0.5 : 0.3, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {player.number}
            </motion.span>

            {/* Team Logo — above name */}
            {player.teamLogoUrl && (
              <motion.div
                className="design-one-team-logo relative w-24 h-24 lg:w-32 lg:h-32 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Image
                  src={player.teamLogoUrl}
                  alt="Team logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </motion.div>
            )}

            {/* Name */}
            <h1
              className="design-one-hero-name text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tight"
              style={{
                textShadow: player.lightMode
                  ? "0 2px 16px rgba(0,0,0,0.25), 0 1px 6px rgba(0,0,0,0.2)"
                  : "0 2px 20px rgba(0,0,0,0.9), 0 1px 8px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.4)",
              }}
            >
              <span
                className="design-one-first-name block text-white/40 text-2xl sm:text-3xl lg:text-4xl font-medium mb-1"
                style={{
                  textShadow: player.lightMode
                    ? "0 1px 10px rgba(0,0,0,0.2)"
                    : "0 1px 14px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.4)",
                }}
              >
                {player.firstName}
              </span>
              {player.lastName}
            </h1>

            {/* Quick Info */}
            <motion.div
              className="design-one-hero-meta flex gap-4 mt-2 text-xs lg:text-sm text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {player.team && <span>{player.team}</span>}
              {player.team && player.league && <span>|</span>}
              {player.league && <span>{player.league}</span>}
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="design-one-hero-actions grid grid-cols-2 gap-1.5 mt-4 max-w-[55%] lg:max-w-none lg:flex lg:flex-wrap lg:gap-3 [&>*]:justify-center [&>*]:w-full lg:[&>*]:w-auto [&>*]:!px-2.5 [&>*]:!py-1.5 [&>*]:!text-[10px] lg:[&>*]:!px-5 lg:[&>*]:!py-2.5 lg:[&>*]:!text-sm [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {player.highlightReelUrl && (
              isGdrive ? (
                <a
                  href={player.highlightReelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <path d="M15 10l-4 4m0 0l-4-4m4 4V3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
                  </svg>
                  Game Film
                </a>
              ) : (
                <button
                  onClick={() => setShowReel(true)}
                  className="flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Game Film
                </button>
              )
            )}
            {player.resumeUrl && (
              <button
                onClick={() => setShowResume(true)}
                className="flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium text-white/70 border border-white/15 hover:bg-white/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Resume
              </button>
            )}
            {player.transcriptUrl && (
              <a
                href={player.transcriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium text-white/70 border border-white/15 hover:bg-white/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
                Academics
              </a>
            )}
            {player.socialLinks
              ?.filter((l) => l.showInHero)
              .map((l, i) => {
                if (!isHeroSocialPlatform(l.platform)) return null;

                const meta = heroSocialMeta[l.platform];
                const className = "flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium text-white/70 border border-white/15 hover:bg-white/5 transition-colors";
                const content = (
                  <>
                    {meta.mask ? (
                      <span
                        aria-hidden
                        className="w-7 h-5 lg:w-8 lg:h-6 bg-current"
                        style={{
                          WebkitMaskImage: `url(${meta.logo})`,
                          maskImage: `url(${meta.logo})`,
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }}
                      />
                    ) : (
                      <Image
                        src={meta.logo}
                        alt=""
                        width={32}
                        height={24}
                        aria-hidden
                        className="h-5 w-7 object-contain lg:h-6 lg:w-8"
                      />
                    )}
                    {meta.label}
                  </>
                );

                if (!l.url) {
                  return (
                    <span key={`${l.platform}-${i}`} className={`${className} pointer-events-none`}>
                      {content}
                    </span>
                  );
                }

                return (
                  <a
                    key={`${l.platform}-${i}`}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                );
              })}
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      {player.highlightReelUrl && !isGdrive && (
        <VideoModal
          url={player.highlightReelUrl}
          isOpen={showReel}
          onClose={() => setShowReel(false)}
        />
      )}

      {/* PDF Modal */}
      {player.resumeUrl && (
        <PdfModal
          url={player.resumeUrl}
          isOpen={showResume}
          onClose={() => setShowResume(false)}
        />
      )}
    </>
  );
}
