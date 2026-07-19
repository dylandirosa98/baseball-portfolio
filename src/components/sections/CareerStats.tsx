"use client";

import { motion } from "framer-motion";
import { PlayerStats, SeasonStats } from "@/lib/types";

interface CareerStatsProps {
  seasons: SeasonStats[];
  position?: string;
}

type StatItem = { key: keyof PlayerStats; label: string; decimals?: number };

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

function format(stats: PlayerStats, item: StatItem) {
  const value = Number(stats[item.key] ?? 0);
  return item.decimals ? value.toFixed(item.decimals) : Math.round(value).toString();
}

export default function CareerStats({ seasons, position }: CareerStatsProps) {
  const items = position === "Pitcher" ? pitcherStats : hitterStats;

  return (
    <section data-profile-section="career-stats" className="profile-section px-5 py-12 lg:mx-auto lg:max-w-4xl lg:py-16">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Season history</h2>
        </div>
        <div className="space-y-3 lg:hidden">
          {seasons.map((season) => (
            <div key={season.season} className="rounded-lg bg-white/5 p-4">
              <p className="font-bold">{season.season}</p>
              <p className="mb-4 text-xs text-white/40">{season.team} / {season.league}</p>
              <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.key}>
                    <p className="font-bold tabular-nums">{format(season.stats, item)}</p>
                    <p className="text-[9px] text-white/35">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg bg-white/5 lg:block">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 text-left">Season</th>
                <th className="px-4 py-3 text-left">Team</th>
                {items.map((item) => <th key={item.key} className="px-3 py-3 text-center">{item.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.season} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-bold">{season.season}</td>
                  <td className="px-4 py-3 text-white/60">{season.team}</td>
                  {items.map((item) => <td key={item.key} className="px-3 py-3 text-center tabular-nums">{format(season.stats, item)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}
