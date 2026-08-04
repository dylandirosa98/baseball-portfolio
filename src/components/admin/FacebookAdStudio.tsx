"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, LoaderCircle, Megaphone } from "lucide-react";
import { facebookAdCreatives, type FacebookAdCreative } from "@/lib/facebook-ad-content";

type AdFormat = "square" | "portrait";

const FORMAT_SIZE: Record<AdFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Portrait · 4:5" },
};

function TextLines({ lines, x, y, size, lineHeight, fill = "#fff", anchor = "start" }: { lines: string[]; x: number; y: number; size: number; lineHeight: number; fill?: string; anchor?: "start" | "middle" }) {
  return <text x={x} y={y} fill={fill} fontFamily="Arial, Helvetica, sans-serif" fontSize={size} fontWeight="900" textAnchor={anchor} letterSpacing="-2">{lines.map((line, index) => <tspan key={line} x={x} dy={index ? lineHeight : 0}>{line}</tspan>)}</text>;
}

function wrapText(text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

export function FacebookAdArtwork({ creative, format }: { creative: FacebookAdCreative; format: AdFormat }) {
  const { width, height } = FORMAT_SIZE[format];
  const portrait = format === "portrait";
  const gradientId = `ad-gradient-${creative.id}-${format}`;
  const fadeId = `ad-fade-${creative.id}-${format}`;
  const clipId = `ad-clip-${creative.id}-${format}`;
  const titleSize = portrait ? 82 : 52;
  const titleY = portrait ? 264 : 238;
  const copyLines = wrapText(creative.supportingText, portrait ? 42 : 37).slice(0, 4);
  const imageX = portrait ? 214 : 620;
  const imageY = portrait ? 650 : 142;
  const imageWidth = portrait ? 652 : 390;
  const imageHeight = portrait ? 650 : 780;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={creative.name} className="block h-full w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#280006" /><stop offset="0.5" stopColor="#0d0f12" /><stop offset="1" stopColor="#050607" /></linearGradient>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#050607" stopOpacity="0.94" /></linearGradient>
        <clipPath id={clipId}><rect x={imageX} y={imageY} width={imageWidth} height={imageHeight} rx={portrait ? 34 : 28} /></clipPath>
      </defs>

      <rect width={width} height={height} fill={`url(#${gradientId})`} />
      {Array.from({ length: 15 }, (_, index) => <line key={`grid-${index}`} x1={index * 90} y1="0" x2={index * 90 - 400} y2={height} stroke="#fff" strokeOpacity="0.035" />)}
      <rect x="0" y="0" width="13" height={height} fill="#e5162a" />
      <circle cx={portrait ? 905 : 865} cy={portrait ? 225 : 165} r={portrait ? 210 : 175} fill="#e5162a" fillOpacity="0.12" />

      <image href="/diamond-profile-logo.png" x="58" y="48" width="58" height="58" preserveAspectRatio="xMidYMid meet" />
      <text x="132" y="84" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="21" fontWeight="900" letterSpacing="1.4">DIAMOND PROFILE</text>
      <rect x="58" y="142" width="46" height="7" fill="#e5162a" />
      <text x="121" y="151" fill="#ff8791" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontWeight="900" letterSpacing="2.8">{creative.eyebrow}</text>

      <TextLines lines={creative.headline} x={58} y={titleY} size={titleSize} lineHeight={titleSize * 0.92} />
      <TextLines lines={copyLines} x={60} y={titleY + creative.headline.length * titleSize * 0.92 + 38} size={portrait ? 28 : 24} lineHeight={portrait ? 38 : 34} fill="#afb3b8" />

      <rect x={imageX - 14} y={imageY - 14} width={imageWidth + 28} height={imageHeight + 28} rx={portrait ? 46 : 40} fill="#050607" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
      <image href={creative.image} x={imageX} y={imageY} width={imageWidth} height={imageHeight} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
      <rect x={imageX} y={imageY} width={imageWidth} height={imageHeight} fill={`url(#${fadeId})`} clipPath={`url(#${clipId})`} />

      {!portrait && <rect x="58" y="902" width="490" height="78" rx="39" fill="#e5162a" />}
      {!portrait && <text x="303" y="952" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="24" fontWeight="900" textAnchor="middle">BUILD THEIR PROFILE</text>}
      {portrait && <rect x="58" y="1212" width="964" height="80" rx="40" fill="#e5162a" />}
      {portrait && <text x="540" y="1263" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="25" fontWeight="900" textAnchor="middle">BUILD THEIR PROFILE AT DIAMONDPROFILE.APP</text>}
      {!portrait && <text x="58" y="1030" fill="#fff" fillOpacity="0.48" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700" letterSpacing="2.4">DIAMONDPROFILE.APP</text>}
    </svg>
  );
}

const assetCache = new Map<string, string>();

async function imageDataUrl(url: string) {
  const cached = assetCache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  const blob = await response.blob();
  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Image conversion failed."));
    reader.readAsDataURL(blob);
  });
  assetCache.set(url, result);
  return result;
}

async function renderPng(sourceSvg: SVGSVGElement, format: AdFormat) {
  const { width, height } = FORMAT_SIZE[format];
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  for (const image of Array.from(clone.querySelectorAll("image"))) {
    const href = image.getAttribute("href");
    if (href?.startsWith("/")) image.setAttribute("href", await imageDataUrl(href));
  }
  const source = new XMLSerializer().serializeToString(clone);
  const objectUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const rendered = new Image();
    await new Promise<void>((resolve, reject) => {
      rendered.onload = () => resolve();
      rendered.onerror = () => reject(new Error("The creative could not be rendered."));
      rendered.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas export is unavailable.");
    context.drawImage(rendered, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed.")), "image/png", 1));
  } finally { URL.revokeObjectURL(objectUrl); }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FacebookAdStudio() {
  const [creativeIndex, setCreativeIndex] = useState(0);
  const [format, setFormat] = useState<AdFormat>("square");
  const [downloading, setDownloading] = useState<"current" | "both" | null>(null);
  const [copied, setCopied] = useState<"primary" | "all" | null>(null);
  const [error, setError] = useState("");
  const squareRef = useRef<HTMLDivElement | null>(null);
  const portraitRef = useRef<HTMLDivElement | null>(null);
  const creative = facebookAdCreatives[creativeIndex];

  function getSvg(selectedFormat: AdFormat) {
    return (selectedFormat === "square" ? squareRef.current : portraitRef.current)?.querySelector("svg") || null;
  }

  async function exportFormat(selectedFormat: AdFormat) {
    const svg = getSvg(selectedFormat);
    if (!svg) throw new Error("The creative is still loading. Try again.");
    downloadBlob(await renderPng(svg, selectedFormat), `${creative.id}-${selectedFormat}.png`);
  }

  async function downloadCurrent() {
    setDownloading("current"); setError("");
    try { await exportFormat(format); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Export failed."); }
    finally { setDownloading(null); }
  }

  async function downloadBoth() {
    setDownloading("both"); setError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const selectedFormat of ["square", "portrait"] as const) {
        const svg = getSvg(selectedFormat);
        if (!svg) throw new Error("The creative is still loading. Try again.");
        zip.file(`${creative.id}-${selectedFormat}.png`, await renderPng(svg, selectedFormat));
      }
      downloadBlob(await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }), `${creative.id}-facebook-ad-kit.zip`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Export failed."); }
    finally { setDownloading(null); }
  }

  async function copyText(type: "primary" | "all") {
    const text = type === "primary" ? creative.primaryText : `PRIMARY TEXT\n${creative.primaryText}\n\nHEADLINE\n${creative.linkHeadline}\n\nDESCRIPTION\n${creative.description}\n\nCTA\n${creative.cta}`;
    await navigator.clipboard.writeText(text);
    setCopied(type); window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <section id="facebook-ads" className="overflow-hidden rounded-2xl border border-white/10 bg-[#08121a]">
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:p-6">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6673]">Facebook acquisition</p><h2 className="mt-2 text-2xl font-black">Parent-focused ad creative lab</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Six ready-to-test concepts built for adults making or influencing the purchase. Export each in square and portrait feed formats, then copy the matching ad text.</p></div>
        <span className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/50"><Megaphone className="h-4 w-4 text-[#ff6673]" /> 6 concepts · 12 images</span>
      </div>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-x-auto border-b border-white/10 p-3 lg:max-h-[1050px] lg:overflow-x-hidden lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
          <p className="px-2 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Creative tests</p>
          <div className="flex gap-2 lg:grid">{facebookAdCreatives.map((item, index) => <button key={item.id} onClick={() => { setCreativeIndex(index); setError(""); setCopied(null); }} className={`min-w-[270px] rounded-xl border p-4 text-left transition lg:min-w-0 ${index === creativeIndex ? "border-[#e5162a] bg-[#e5162a]/10" : "border-white/[.08] bg-white/[.02] hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><span className="font-mono text-[10px] text-white/25">AD {String(index + 1).padStart(2, "0")}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-white/40">{item.angle}</span></div><h3 className="mt-3 text-sm font-black">{item.name}</h3><p className="mt-2 text-xs leading-5 text-white/40">{item.audience}</p></button>)}</div>
          <div className="mt-4 hidden rounded-xl border border-white/10 bg-black/15 p-4 text-xs leading-5 text-white/40 lg:block"><p className="font-bold text-white/70">Suggested first test</p><p className="mt-2">Run ads 1–3 with the same broad parent-age audience and budget. Let the creative angle be the main variable.</p></div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div><p className="text-xs font-bold text-[#ff7d87]">Creative {creativeIndex + 1} of {facebookAdCreatives.length} · {creative.angle}</p><h3 className="mt-1 text-xl font-black sm:text-2xl">{creative.name}</h3><p className="mt-2 text-sm text-white/40">Audience: {creative.audience}</p>{error && <p className="mt-2 text-xs text-red-200">{error}</p>}</div>
            <div className="grid grid-cols-2 gap-2 sm:flex"><button onClick={() => void downloadBoth()} disabled={downloading !== null} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e5162a] px-4 text-xs font-black text-white disabled:opacity-50 sm:col-span-1 sm:text-sm">{downloading === "both" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}Download both sizes</button><button onClick={() => void downloadCurrent()} disabled={downloading !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-black text-black disabled:opacity-50 sm:text-sm">{downloading === "current" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Current size</button><button onClick={() => void copyText("all")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-xs font-black sm:text-sm">{copied === "all" ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied === "all" ? "Copied" : "Copy all text"}</button></div>
          </div>

          <div className="mt-5 flex w-fit rounded-lg border border-white/10 bg-black/20 p-1">{(["square", "portrait"] as const).map((item) => <button key={item} onClick={() => setFormat(item)} className={`min-h-10 rounded-md px-4 text-xs font-bold transition ${format === item ? "bg-white text-black" : "text-white/45 hover:text-white"}`}>{FORMAT_SIZE[item].label}</button>)}</div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(360px,650px)_minmax(280px,1fr)]">
            <div>
              <div className={`relative mx-auto w-full max-w-[650px] overflow-hidden rounded-xl bg-black shadow-[0_30px_90px_rgba(0,0,0,.5)] ring-1 ring-white/15 ${format === "square" ? "aspect-square" : "aspect-[4/5]"}`}>
                <div ref={format === "square" ? squareRef : portraitRef} className="h-full w-full"><FacebookAdArtwork creative={creative} format={format} /></div>
              </div>
              <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">{format !== "square" && <div ref={squareRef}><FacebookAdArtwork creative={creative} format="square" /></div>}{format !== "portrait" && <div ref={portraitRef}><FacebookAdArtwork creative={creative} format="portrait" /></div>}</div>
            </div>

            <aside className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ff7d87]">Primary text</p><p className="mt-1 text-[11px] text-white/30">Appears above the creative.</p></div><button onClick={() => void copyText("primary")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold">{copied === "primary" ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied === "primary" ? "Copied" : "Copy"}</button></div><p className="mt-4 text-sm leading-6 text-white/65">{creative.primaryText}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[.025] p-5"><dl className="space-y-4 text-sm"><div><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">Headline</dt><dd className="mt-1 font-bold text-white/80">{creative.linkHeadline}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">Description</dt><dd className="mt-1 text-white/55">{creative.description}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">CTA button</dt><dd className="mt-1 text-white/55">{creative.cta}</dd></div></dl></div>
              <div className="rounded-xl border border-[#e5162a]/25 bg-[#e5162a]/5 p-5 text-xs leading-5 text-white/50"><p className="font-bold text-white/80">Campaign note</p><p className="mt-2">These ads promise clearer presentation and easier sharing—not scholarships, coach responses, or recruiting outcomes. Send traffic to the main landing page and optimize for completed sign-ups once conversion volume is available.</p></div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
