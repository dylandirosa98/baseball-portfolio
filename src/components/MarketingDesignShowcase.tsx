"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";

const designs = [
  {
    id: "cinematic",
    name: "Cinematic",
    number: "01",
    copy: "Big image, bold name, immediate impact.",
  },
  {
    id: "clubhouse",
    name: "Clubhouse",
    number: "02",
    copy: "Editorial split layout with structured details.",
  },
  {
    id: "prospect",
    name: "Prospect Card",
    number: "03",
    copy: "Centered identity with a modern player-card feel.",
  },
] as const;

type DesignId = (typeof designs)[number]["id"];

function CinematicPreview() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-2xl bg-[#090a0c] sm:min-h-[590px]">
      <Image src="/images/baseball-hero-no-people.png" alt="" fill className="object-cover object-center opacity-55" sizes="(min-width:1024px) 1100px, 95vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,10,.98),rgba(7,8,10,.64)_55%,rgba(7,8,10,.12))]" />
      <span className="absolute right-3 top-3 text-[8rem] font-light leading-none text-[#ff5965]/30 sm:right-8 sm:text-[13rem]">12</span>
      <div className="absolute bottom-0 right-[-10%] h-[88%] w-[82%] sm:right-[-2%] sm:w-[66%]">
        <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-85" sizes="(min-width:1024px) 700px, 85vw" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(transparent,rgba(7,8,10,.97)_45%)] px-6 pb-7 pt-32 sm:px-10 sm:pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a7a]">Shortstop · Class of 2027</p>
        <h3 className="mt-3 text-5xl font-bold tracking-[-0.055em] sm:text-7xl">Marcus Cole</h3>
        <p className="mt-3 text-sm text-white/45">Motor City Select · Detroit, Michigan</p>
        <div className="mt-6 grid max-w-lg grid-cols-3 gap-2 sm:grid-cols-6">
          {[[".347", "AVG"], [".429", "OBP"], [".518", "SLG"], ["5", "HR"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/35 px-2 py-2.5 text-center backdrop-blur"><strong className="block text-sm">{value}</strong><span className="text-[8px] text-white/35">{label}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClubhousePreview() {
  return (
    <div className="relative min-h-[580px] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#531019,#160b0f_48%,#08090b)] sm:min-h-[590px]">
      <div className="absolute inset-y-0 left-0 w-2 bg-[#e01010]" />
      <div className="relative z-10 px-7 pt-10 sm:w-[52%] sm:px-12 sm:pt-16">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55"><span className="h-2 w-2 rounded-full bg-[#ff5965]" /> Motor City Select</div>
        <p className="mt-16 text-sm font-bold uppercase tracking-[0.3em] text-[#ff7a7a]">Shortstop</p>
        <h3 className="mt-3 text-5xl font-bold leading-[.86] tracking-[-0.06em] sm:text-7xl">Marcus<br />Cole</h3>
        <div className="mt-7 flex flex-wrap gap-2 text-xs text-white/55"><span className="rounded-full border border-white/15 px-3 py-2">Class of 2027</span><span className="rounded-full border border-white/15 px-3 py-2">Bats R · Throws R</span></div>
      </div>
      <span className="absolute bottom-4 right-4 text-[8rem] font-light leading-none text-white/10 sm:right-8 sm:text-[13rem]">12</span>
      <div className="absolute bottom-0 right-[-16%] h-[62%] w-[96%] sm:right-[-4%] sm:h-[92%] sm:w-[64%]">
        <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-82" sizes="(min-width:1024px) 700px, 95vw" />
      </div>
      <div className="absolute bottom-6 left-7 z-20 hidden grid-cols-3 gap-2 sm:left-12 sm:grid">
        {[[".347", "AVG"], ["31", "RBI"], ["14", "SB"]].map(([value, label]) => <div key={label} className="w-20 border-t border-[#ff5965] pt-2"><strong className="block">{value}</strong><span className="text-[9px] text-white/35">{label}</span></div>)}
      </div>
    </div>
  );
}

function ProspectPreview() {
  return (
    <div className="relative flex min-h-[580px] items-end justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_38%,#851523_0%,#2b0b11_42%,#08090b_76%)] p-7 text-center sm:min-h-[590px] sm:p-10">
      <div className="absolute left-1/2 top-10 h-[360px] w-[250px] -translate-x-1/2 rounded-[50%] border border-white/10 sm:h-[440px] sm:w-[330px]" />
      <div className="absolute left-1/2 top-20 h-[300px] w-[205px] -translate-x-1/2 rounded-[50%] border border-[#ff5965]/35 sm:h-[360px] sm:w-[270px]" />
      <span className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#ff5965] bg-[#21070c] text-lg font-semibold sm:left-8 sm:top-8">12</span>
      <p className="absolute right-6 top-8 text-xs font-semibold uppercase tracking-[0.18em] text-white/45 sm:right-10">Class of 2027</p>
      <div className="absolute left-1/2 top-8 h-[78%] w-[88%] -translate-x-1/2 sm:w-[64%]">
        <Image src="/images/player-placeholder.png" alt="" fill className="object-contain object-bottom opacity-90" sizes="(min-width:1024px) 650px, 90vw" />
      </div>
      <div className="relative z-10 w-full rounded-2xl border border-white/15 bg-black/45 p-5 backdrop-blur-md sm:max-w-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7a7a]">Shortstop · Motor City Select</p>
        <h3 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Marcus Cole</h3>
        <div className="mt-4 flex justify-center gap-5 text-xs text-white/55"><span><strong className="mr-1 text-white">.347</strong> AVG</span><span><strong className="mr-1 text-white">31</strong> RBI</span><span><strong className="mr-1 text-white">14</strong> SB</span></div>
      </div>
    </div>
  );
}

export function MarketingDesignShowcase() {
  const [selectedId, setSelectedId] = useState<DesignId>("cinematic");
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

      <article id="design-preview-panel" role="tabpanel" aria-labelledby={`design-tab-${selected.id}`} className="overflow-hidden rounded-2xl border border-[#a02a35] bg-[#3b0c14]">
        {selected.id === "cinematic" && <CinematicPreview />}
        {selected.id === "clubhouse" && <ClubhousePreview />}
        {selected.id === "prospect" && <ProspectPreview />}
        <div className="flex min-h-24 items-center justify-between gap-4 p-5 sm:px-7">
          <div><p className="text-xs font-semibold text-[#ff7a7a]">Design {selected.number}</p><p className="mt-1 text-sm leading-6 text-white/60">{selected.copy}</p></div>
          <Palette className="h-5 w-5 shrink-0 text-white/30" />
        </div>
      </article>

      <Link href="/builder" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Try every design free <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}
