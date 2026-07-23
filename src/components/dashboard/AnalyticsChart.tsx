type AnalyticsPoint = {
  label: string;
  views: number;
  videoPlays: number;
};

export default function AnalyticsChart({ points }: { points: AnalyticsPoint[] }) {
  const max = Math.max(1, ...points.flatMap((point) => [point.views, point.videoPlays]));

  return (
    <div>
      <div className="flex h-52 items-end gap-1 sm:gap-1.5" aria-label="Daily portfolio analytics chart">
        {points.map((point, index) => (
          <div key={point.label + index} className="group relative flex h-full min-w-0 flex-1 items-end gap-px">
            <span
              className="w-1/2 min-w-[2px] rounded-t-sm bg-[#ff5a2f] transition-opacity group-hover:opacity-75"
              style={{ height: `${Math.max(point.views ? 4 : 0, (point.views / max) * 100)}%` }}
            />
            <span
              className="w-1/2 min-w-[2px] rounded-t-sm bg-[#f4c95d] transition-opacity group-hover:opacity-75"
              style={{ height: `${Math.max(point.videoPlays ? 4 : 0, (point.videoPlays / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#111820] px-2 py-1.5 text-[10px] text-white shadow-xl group-hover:block">
              {point.label}: {point.views} views · {point.videoPlays} plays
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
}
