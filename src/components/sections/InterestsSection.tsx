"use client";

import { motion } from "framer-motion";
import { Player } from "@/lib/types";
import MediaCarousel from "./MediaCarousel";
import { hasMediaSource } from "@/lib/video";

export default function InterestsSection({ player }: { player: Player }) {
  const media = (player.interestsMedia ?? []).filter(hasMediaSource);
  if (!player.interests && media.length === 0) return null;

  return (
    <section data-profile-section="interests" className="profile-section px-5 py-10 lg:max-w-4xl lg:mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">
            Outside the Rink
          </h2>
        </div>
        {player.interests && (
          <p className="text-white/70 text-sm lg:text-base leading-relaxed">
            {player.interests}
          </p>
        )}
        {media.length > 0 && (
          <div className={player.interests ? "mt-6" : ""}>
            <MediaCarousel items={media} accentColor={player.themeColor} lightMode={player.lightMode} />
          </div>
        )}
      </motion.div>
    </section>
  );
}
