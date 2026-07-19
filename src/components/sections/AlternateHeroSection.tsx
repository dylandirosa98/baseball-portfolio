"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, FileDown, GraduationCap, Play } from "lucide-react";
import PdfModal from "@/components/PdfModal";
import VideoModal from "@/components/VideoModal";
import { detectVideo } from "@/lib/video";
import { isPlaceholderPlayerImage, normalizedHeroImageScale, playerImageOrFallback } from "@/lib/player-image";
import type { Player, PlayerDesign } from "@/lib/types";

interface AlternateHeroSectionProps {
  player: Player;
  design: Exclude<PlayerDesign, "design-1">;
}

export default function AlternateHeroSection({ player, design }: AlternateHeroSectionProps) {
  const [showReel, setShowReel] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const defaultHeroImage = isPlaceholderPlayerImage(player.heroImageUrl);
  const heroImageScale = normalizedHeroImageScale(player.heroImageUrl, player.heroImageScale);
  const reelVideo = player.highlightReelUrl ? detectVideo(player.highlightReelUrl) : null;
  const opensExternally = reelVideo?.platform === "gdrive-folder" || reelVideo?.platform === "gdrive-file";
  const nameClass = player.lastName.trim().length > 18 ? "is-very-long" : player.lastName.trim().length > 11 ? "is-long" : undefined;
  const heroLinks = player.socialLinks.filter((link) => link.showInHero && (link.platform === "ncsa" || link.platform === "hudl"));

  const actionClass = design === "design-2"
    ? "alternate-hero-action"
    : "alternate-hero-action alternate-hero-action--card";

  const actions = (
    <div className="alternate-hero-actions">
      {player.highlightReelUrl && (
        opensExternally ? (
          <a className={actionClass} href={player.highlightReelUrl} target="_blank" rel="noopener noreferrer">
            <Play aria-hidden className="h-4 w-4" />
            Game Film
          </a>
        ) : (
          <button className={actionClass} type="button" onClick={() => setShowReel(true)}>
            <Play aria-hidden className="h-4 w-4 fill-current" />
            Game Film
          </button>
        )
      )}
      {player.resumeUrl && (
        <button className={actionClass} type="button" onClick={() => setShowResume(true)}>
          <FileDown aria-hidden className="h-4 w-4" />
          Resume
        </button>
      )}
      {player.transcriptUrl && (
        <a className={actionClass} href={player.transcriptUrl} target="_blank" rel="noopener noreferrer">
          <GraduationCap aria-hidden className="h-4 w-4" />
          Academics
        </a>
      )}
      {heroLinks.map((link, index) => (
        link.url ? (
          <a
            key={`${link.platform}-${index}`}
            className={actionClass}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden className="h-4 w-4" />
            {link.platform.toUpperCase()}
          </a>
        ) : (
          <span key={`${link.platform}-${index}`} className={actionClass}>
            <ExternalLink aria-hidden className="h-4 w-4" />
            {link.platform.toUpperCase()}
          </span>
        )
      ))}
    </div>
  );

  return (
    <>
      {design === "design-2" ? (
        <section className="alternate-hero alternate-hero--split">
          <div className="split-hero-accent" />
          <motion.div
            className="split-hero-copy"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div className="split-hero-kicker">
              {player.teamLogoUrl && (
                <span className="relative h-12 w-12 shrink-0">
                  <Image src={player.teamLogoUrl} alt="" fill className="object-contain" unoptimized />
                </span>
              )}
              <span>
                <span>{player.team || player.position}</span>
                {player.league && <small>{player.league}</small>}
              </span>
            </div>
            <div className="split-hero-name">
              <p>{player.firstName}</p>
              <h1 className={nameClass}>{player.lastName}</h1>
            </div>
            <div className="split-hero-meta">
              {player.position && player.team && <span>{player.position}</span>}
              {player.hometown && <span>{player.hometown}</span>}
            </div>
            {actions}
          </motion.div>

          <motion.div
            className="split-hero-image"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src={playerImageOrFallback(player.heroImageUrl)}
              alt={`${player.firstName} ${player.lastName}`}
              fill
              priority
              className={"split-hero-player object-contain object-bottom" + (defaultHeroImage ? " default-player-image" : "")}
              style={{ transform: "scale(" + heroImageScale / 100 + ")", transformOrigin: "bottom center" }}
            />
            <span className="split-hero-number" style={{ color: player.numberColor || player.themeColor }}>
              {player.number}
            </span>
          </motion.div>
        </section>
      ) : (
        <section className="alternate-hero alternate-hero--card">
          <div className="card-hero-grid" />
          <div className="card-hero-orbit card-hero-orbit--one" />
          <div className="card-hero-orbit card-hero-orbit--two" />
          <motion.div
            className="card-hero-image"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          >
            <Image
              src={playerImageOrFallback(player.heroImageUrl)}
              alt={`${player.firstName} ${player.lastName}`}
              fill
              priority
              className={"object-contain object-bottom" + (defaultHeroImage ? " default-player-image" : "")}
              style={{ transform: "scale(" + heroImageScale / 100 + ")", transformOrigin: "bottom center" }}
            />
          </motion.div>
          <span className="card-hero-number" style={{ color: player.numberColor || player.themeColor }}>
            {player.number}
          </span>

          <motion.div
            className="card-hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          >
            <div className="card-hero-team">
              {player.teamLogoUrl && (
                <span className="relative h-8 w-8 shrink-0">
                  <Image src={player.teamLogoUrl} alt="" fill className="object-contain" unoptimized />
                </span>
              )}
              <span className="card-hero-team-copy">
                {player.position && <span>{player.position}</span>}
                {player.team && <span>{player.team}</span>}
                {player.league && <span>{player.league}</span>}
              </span>
            </div>
            <h1 className={nameClass}>
              <span>{player.firstName}</span>
              {player.lastName}
            </h1>
            {player.hometown && (
              <p className="card-hero-meta"><span>{player.hometown}</span></p>
            )}
            {actions}
          </motion.div>
        </section>
      )}

      {player.highlightReelUrl && !opensExternally && (
        <VideoModal url={player.highlightReelUrl} isOpen={showReel} onClose={() => setShowReel(false)} />
      )}
      {player.resumeUrl && (
        <PdfModal url={player.resumeUrl} isOpen={showResume} onClose={() => setShowResume(false)} />
      )}
    </>
  );
}
