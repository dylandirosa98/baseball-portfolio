"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Player } from "@/lib/types";
import MediaCarousel from "./MediaCarousel";
import { hasMediaSource } from "@/lib/video";

interface BioSectionProps {
  player: Player;
}

export default function BioSection({ player }: BioSectionProps) {
  const media = (player.media ?? []).filter(hasMediaSource);

  return (
    <section className="px-5 py-12 lg:max-w-4xl lg:mx-auto lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">
            About
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 lg:gap-10">
          {/* Headshot */}
          <motion.div
            className="relative w-28 h-28 lg:w-40 lg:h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src={player.headshotUrl}
              alt={`${player.firstName} ${player.lastName}`}
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Bio text */}
          <div className="flex-1">
            <p className="text-white/70 text-sm lg:text-base leading-relaxed">{player.bio}</p>
          </div>
        </div>

        {/* Media carousel — no label, just flows below bio */}
        {media.length > 0 && (
          <div className="mt-6">
            <MediaCarousel items={media} accentColor={player.themeColor} lightMode={player.lightMode} />
          </div>
        )}
      </motion.div>
    </section>
  );
}
