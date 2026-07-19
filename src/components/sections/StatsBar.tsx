"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PlayerStats } from "@/lib/types";

interface StatsBarProps {
  stats: PlayerStats;
  position?: string;
}

type StatItem = {
  key: keyof PlayerStats;
  label: string;
  decimals?: number;
};

const hitterStats: StatItem[] = [
  { key: "gamesPlayed", label: "GP" },
  { key: "battingAverage", label: "AVG", decimals: 3 },
  { key: "onBasePercentage", label: "OBP", decimals: 3 },
  { key: "sluggingPercentage", label: "SLG", decimals: 3 },
  { key: "homeRuns", label: "HR" },
  { key: "runsBattedIn", label: "RBI" },
];

const pitcherStats: StatItem[] = [
  { key: "inningsPitched", label: "IP", decimals: 1 },
  { key: "wins", label: "W" },
  { key: "losses", label: "L" },
  { key: "earnedRunAverage", label: "ERA", decimals: 2 },
  { key: "whip", label: "WHIP", decimals: 2 },
  { key: "strikeoutsPitched", label: "K" },
];

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / 900, 1);
      setDisplay((1 - Math.pow(1 - progress, 3)) * value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return <span ref={ref}>{decimals ? display.toFixed(decimals) : Math.round(display)}</span>;
}

export default function StatsBar({ stats, position }: StatsBarProps) {
  const items = position === "Pitcher" ? pitcherStats : hitterStats;

  return (
    <section data-profile-section="stats" className="profile-section profile-stats-section px-5 pb-2 pt-6 lg:mx-auto lg:max-w-4xl lg:pb-4 lg:pt-10">
      <motion.div
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {items.map((item) => (
          <div key={item.key} className="flex min-h-20 flex-col items-center justify-center rounded-lg bg-white/5 px-1 py-3">
            <span className="text-lg font-black tabular-nums lg:text-2xl">
              <AnimatedNumber value={Number(stats[item.key] ?? 0)} decimals={item.decimals} />
            </span>
            <span className="mt-1 text-[10px] font-medium text-white/40">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
