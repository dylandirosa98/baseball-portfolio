"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player, TimelineEntry } from "@/lib/types";
import MediaCarousel from "./MediaCarousel";
import { hasMediaSource } from "@/lib/video";

function TimelineItem({ entry, accentColor, isOpen, onToggle, lightMode }: {
  entry: TimelineEntry;
  accentColor: string;
  isOpen: boolean;
  onToggle: () => void;
  lightMode?: boolean;
}) {
  const media = (entry.media ?? []).filter(hasMediaSource);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm font-semibold text-white group-hover:text-white/80 transition-colors">
          {entry.title}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 space-y-5">
              {media.length > 0 && (
                <MediaCarousel items={media} accentColor={accentColor} lightMode={lightMode} />
              )}
              {entry.description && (
                <p className="text-white/70 text-sm lg:text-base leading-relaxed">
                  {entry.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TimelineSection({ player }: { player: Player }) {
  const entries = (player.timeline ?? []).filter((e) => e.title?.trim());
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (entries.length === 0) return null;

  return (
    <section data-profile-section="timeline" className="profile-section px-5 py-10 lg:max-w-4xl lg:mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">
            {player.firstName}&apos;s Baseball Journey
          </h2>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4">
          {entries.map((entry, i) => (
            <TimelineItem
              key={i}
              entry={entry}
              accentColor={player.themeColor}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              lightMode={player.lightMode}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
