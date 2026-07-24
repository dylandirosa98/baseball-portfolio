"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";

const designs = [
  {
    id: "design-1",
    name: "Cinematic",
    number: "01",
    copy: "Big image, bold name, immediate impact.",
    image: "/images/marketing-design-1.png",
    alt: "Design 1 player profile preview",
  },
  {
    id: "design-2",
    name: "Clubhouse",
    number: "02",
    copy: "An editorial split layout with structured details.",
    image: "/images/marketing-design-2.png",
    alt: "Design 2 player profile preview",
  },
  {
    id: "design-3",
    name: "Prospect Card",
    number: "03",
    copy: "A centered identity with a modern player-card feel.",
    image: "/images/marketing-design-3.png",
    alt: "Design 3 player profile preview",
  },
] as const;

type DesignId = (typeof designs)[number]["id"];

export function MarketingDesignShowcase() {
  const [selectedId, setSelectedId] = useState<DesignId>("design-1");
  const selected = designs.find((design) => design.id === selectedId) ?? designs[0];

  return (
    <div className="mt-14 rounded-[2rem] border border-[#721620] bg-[#21070c] p-4 sm:p-8">
      <div role="tablist" aria-label="Profile design previews" className="mx-auto mb-7 flex w-full max-w-lg rounded-full border border-white/25 p-1 text-[11px] sm:text-sm">
        {designs.map((design) => {
          const active = design.id === selectedId;
          return (
            <button
              key={design.id}
              id={`design-tab-${design.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="design-preview-panel"
              onClick={() => setSelectedId(design.id)}
              className={`min-h-10 flex-1 rounded-full px-2 transition sm:px-5 ${active ? "border border-[#ff5965] bg-[#4a0d15] font-semibold text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
            >
              {design.name}
            </button>
          );
        })}
      </div>

      <article id="design-preview-panel" role="tabpanel" aria-labelledby={`design-tab-${selected.id}`} className="overflow-hidden rounded-2xl border border-[#a02a35] bg-[#090a0c]">
        <div className="flex min-h-[560px] items-center justify-center bg-[#090a0c] p-3 sm:min-h-[680px] sm:p-8">
          <Image
            src={selected.image}
            alt={selected.alt}
            width={391}
            height={845}
            unoptimized
            className="h-auto max-h-[720px] w-auto max-w-full rounded-xl object-contain shadow-[0_24px_80px_rgba(0,0,0,.55)]"
            sizes="(max-width: 640px) 90vw, 390px"
          />
        </div>
        <div className="flex min-h-24 items-center justify-between gap-4 border-t border-white/10 p-5 sm:px-7">
          <div><p className="text-xs font-semibold text-[#ff7a7a]">Design {selected.number}</p><p className="mt-1 text-sm leading-6 text-white/60">{selected.copy}</p></div>
          <Palette className="h-5 w-5 shrink-0 text-white/30" />
        </div>
      </article>

      <Link href="/builder" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Try every design free <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
