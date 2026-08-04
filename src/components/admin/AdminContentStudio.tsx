"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Download, Images, LoaderCircle } from "lucide-react";
import { instagramCarousels, type InstagramSlide } from "@/lib/instagram-content";

const SIZE = 1080;

function wrapped(text: string, max = 46) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > max && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function SvgLines({ lines, x, y, size, lineHeight, fill, weight = 900, anchor = "start", letterSpacing }: { lines: string[]; x: number; y: number; size: number; lineHeight: number; fill: string; weight?: number; anchor?: "start" | "middle"; letterSpacing?: number }) {
  return <text x={x} y={y} fill={fill} fontFamily="Arial, Helvetica, sans-serif" fontSize={size} fontWeight={weight} textAnchor={anchor} letterSpacing={letterSpacing}>{lines.map((line, index) => <tspan key={`${line}-${index}`} x={x} dy={index ? lineHeight : 0}>{line}</tspan>)}</text>;
}

export function InstagramArtwork({ slide, index, total }: { slide: InstagramSlide; index: number; total: number }) {
  const theme = slide.theme || "dark";
  const dark = theme !== "light";
  const background = theme === "red" ? "#a60012" : theme === "light" ? "#f1eee7" : "#08090b";
  const foreground = dark ? "#ffffff" : "#090b0e";
  const muted = dark ? "#aeb0b4" : "#5b5a57";
  const accent = theme === "red" ? "#ffffff" : "#e5162a";
  const card = dark ? "#111317" : "#ffffff";
  const line = dark ? "#ffffff" : "#08090b";
  const center = slide.layout === "center";
  const split = slide.layout === "split" && slide.image;
  const titleX = center ? 540 : 72;
  const titleY = center ? 360 : 235;
  const titleSize = center ? 100 : split ? 82 : 88;
  const titleLineHeight = titleSize * 0.92;
  const titleBottom = titleY + Math.max(0, slide.title.length - 1) * titleLineHeight;
  const bodyLines = slide.body ? wrapped(slide.body, split ? 34 : center ? 48 : 58) : [];
  const itemsY = Math.max(500, titleBottom + (slide.body ? 175 : 100));
  const itemCount = slide.items?.length || 0;
  const itemColumns = itemCount === 1 ? 1 : 2;
  const cardWidth = itemColumns === 1 ? 936 : 456;
  const cardHeight = itemCount > 2 ? 176 : 230;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${slide.kicker}: ${slide.title.join(" ")}`} xmlns="http://www.w3.org/2000/svg" className="block h-full w-full">
      <defs>
        <linearGradient id="ig-red-glow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d0010" /><stop offset="1" stopColor="#08090b" /></linearGradient>
        <linearGradient id="ig-image-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></linearGradient>
        <clipPath id="ig-image-clip"><rect x="638" y="145" width="370" height="790" rx="26" /></clipPath>
      </defs>
      <rect width={SIZE} height={SIZE} fill={background} />
      {theme === "dark" && <rect width={SIZE} height={SIZE} fill="url(#ig-red-glow)" opacity="0.58" />}
      {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={i * 90} y1="0" x2={i * 90} y2={SIZE} stroke={line} strokeOpacity="0.035" />)}
      {Array.from({ length: 13 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 90} x2={SIZE} y2={i * 90} stroke={line} strokeOpacity="0.035" />)}

      <image href="/diamond-profile-logo.png" x="64" y="48" width="54" height="54" preserveAspectRatio="xMidYMid meet" />
      <text x="132" y="82" fill={foreground} fontFamily="Arial, Helvetica, sans-serif" fontSize="21" fontWeight="900">DIAMOND PROFILE</text>
      <text x="1008" y="80" fill={muted} fontFamily="monospace" fontSize="16" fontWeight="700" textAnchor="end" letterSpacing="3">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</text>

      {split && <>
        <rect x="638" y="145" width="370" height="790" rx="26" fill="#020304" stroke={foreground} strokeOpacity="0.18" />
        <image href={slide.image} x="638" y="145" width="370" height="790" preserveAspectRatio="xMidYMid slice" clipPath="url(#ig-image-clip)" />
        <rect x="638" y="145" width="370" height="790" fill="url(#ig-image-fade)" clipPath="url(#ig-image-clip)" />
      </>}

      <rect x={center ? 510 : 72} y={center ? 228 : 157} width={center ? 60 : 28} height="8" fill={accent} />
      <text x={center ? 540 : 116} y={center ? 278 : 168} fill={theme === "red" ? "#ffd6da" : accent} fontFamily="Arial, Helvetica, sans-serif" fontSize="17" fontWeight="900" textAnchor={center ? "middle" : "start"} letterSpacing="4">{slide.kicker.toUpperCase()}</text>
      <SvgLines lines={slide.title} x={titleX} y={titleY} size={titleSize} lineHeight={titleLineHeight} fill={foreground} anchor={center ? "middle" : "start"} />

      {bodyLines.length > 0 && <SvgLines lines={bodyLines} x={center ? 540 : 74} y={titleBottom + 85} size={center ? 30 : 27} lineHeight={42} fill={muted} weight={500} anchor={center ? "middle" : "start"} />}

      {slide.items?.map((item, itemIndex) => {
        const col = itemIndex % itemColumns;
        const row = Math.floor(itemIndex / itemColumns);
        const x = 72 + col * 480;
        const y = itemsY + row * (cardHeight + 20);
        const detail = wrapped(item.detail, itemColumns === 1 ? 74 : 38).slice(0, 3);
        return <g key={item.label}>
          <rect x={x} y={y} width={cardWidth} height={cardHeight} rx="8" fill={card} stroke={line} strokeOpacity="0.12" />
          <rect x={x} y={y} width="8" height={cardHeight} fill={accent} />
          <text x={x + 32} y={y + 52} fill={foreground} fontFamily="Arial, Helvetica, sans-serif" fontSize="23" fontWeight="900">{item.label}</text>
          <SvgLines lines={detail} x={x + 32} y={y + 92} size={19} lineHeight={29} fill={muted} weight={500} />
        </g>;
      })}

      {slide.note && <>
        <line x1="72" y1="934" x2="1008" y2="934" stroke={line} strokeOpacity="0.16" />
        <text x="72" y="975" fill={foreground} fillOpacity="0.72" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="700">{slide.note}</text>
      </>}
      <text x="72" y="1027" fill={foreground} fillOpacity="0.34" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fontWeight="700" letterSpacing="2.5">DIAMONDPROFILE.APP</text>
      <rect x="896" y="1018" width="112" height="4" fill={accent} />
    </svg>
  );
}

async function imageDataUrl(url: string) {
  const cached = assetDataCache.get(url);
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
  assetDataCache.set(url, result);
  return result;
}

const assetDataCache = new Map<string, string>();

async function renderSlidePng(sourceSvg: SVGSVGElement) {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(SIZE));
  clone.setAttribute("height", String(SIZE));
  for (const image of Array.from(clone.querySelectorAll("image"))) {
    const href = image.getAttribute("href");
    if (href?.startsWith("/")) image.setAttribute("href", await imageDataUrl(href));
  }
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const rendered = new Image();
    await new Promise<void>((resolve, reject) => {
      rendered.onload = () => resolve();
      rendered.onerror = () => reject(new Error("The slide could not be rendered."));
      rendered.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = SIZE; canvas.height = SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas export is unavailable.");
    context.drawImage(rendered, 0, 0, SIZE, SIZE);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG export failed.")), "image/png", 1));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export default function AdminContentStudio() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState("");
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const allSlidesRef = useRef<HTMLDivElement | null>(null);
  const carousel = instagramCarousels[carouselIndex];
  const slide = carousel.slides[slideIndex];
  const progress = useMemo(() => ((slideIndex + 1) / carousel.slides.length) * 100, [carousel, slideIndex]);

  function selectCarousel(index: number) { setCarouselIndex(index); setSlideIndex(0); setCopied(false); }

  async function downloadSlide() {
    if (!svgRef.current) return;
    setDownloading(true); setExportError("");
    try {
      downloadBlob(await renderSlidePng(svgRef.current), `${carousel.id}-slide-${String(slideIndex + 1).padStart(2, "0")}.png`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "The slide could not be downloaded.");
    } finally { setDownloading(false); }
  }

  async function downloadCarousel() {
    const svgs = Array.from(allSlidesRef.current?.querySelectorAll("svg") || []);
    if (svgs.length !== carousel.slides.length) { setExportError("The full carousel is still loading. Try again in a moment."); return; }
    setDownloadingAll(true); setExportProgress(0); setExportError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let index = 0; index < svgs.length; index += 1) {
        const png = await renderSlidePng(svgs[index]);
        zip.file(`${String(index + 1).padStart(2, "0")}-${carousel.id}.png`, png);
        setExportProgress(index + 1);
      }
      const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(archive, `${carousel.id}-instagram-carousel.zip`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "The carousel could not be downloaded.");
    } finally { setDownloadingAll(false); setExportProgress(0); }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(carousel.caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section id="content-studio" className="overflow-hidden rounded-2xl border border-white/10 bg-[#08121a]">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:p-6">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6673]">Instagram production</p><h2 className="mt-2 text-2xl font-black">Content studio</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Ten complete, square carousel posts. Choose a post, review each slide, and export production-ready 1080×1080 PNGs.</p></div>
        <span className="flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/50"><Images className="h-4 w-4 text-[#ff6673]" /> {instagramCarousels.length} carousels · {instagramCarousels.reduce((sum, item) => sum + item.slides.length, 0)} slides</span>
      </div>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-x-auto border-b border-white/10 p-3 lg:max-h-[900px] lg:overflow-x-hidden lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
          <p className="px-2 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Content plan</p>
          <div className="flex gap-2 lg:grid">{instagramCarousels.map((item, index) => <button key={item.id} onClick={() => selectCarousel(index)} className={`min-w-[270px] rounded-xl border p-4 text-left transition lg:min-w-0 ${index === carouselIndex ? "border-[#e5162a] bg-[#e5162a]/10" : "border-white/[.08] bg-white/[.02] hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><span className="font-mono text-[10px] text-white/25">{String(index + 1).padStart(2, "0")}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-white/35">{item.slides.length} slides</span></div><h3 className="mt-3 text-sm font-black">{item.title}</h3><p className="mt-1 text-[11px] text-[#ff7d87]">{item.category}</p><p className="mt-2 text-xs leading-5 text-white/35">{item.objective}</p></button>)}</div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start"><div><p className="text-xs font-bold text-[#ff7d87]">Post {carouselIndex + 1} of {instagramCarousels.length}</p><h3 className="mt-1 text-xl font-black sm:text-2xl">{carousel.title}</h3><p className="mt-2 max-w-xl text-sm text-white/35">{carousel.objective}</p>{exportError && <p className="mt-2 text-xs text-red-200">{exportError}</p>}</div><div className="grid grid-cols-2 gap-2 sm:flex"><button onClick={() => void downloadCarousel()} disabled={downloadingAll || downloading} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e5162a] px-4 text-xs font-black text-white disabled:opacity-50 sm:col-span-1 sm:text-sm">{downloadingAll ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Images className="h-4 w-4" />}{downloadingAll ? `Exporting ${exportProgress}/${carousel.slides.length}` : "Download full carousel"}</button><button onClick={() => void downloadSlide()} disabled={downloading || downloadingAll} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-black text-black disabled:opacity-50 sm:text-sm">{downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Current slide</button><button onClick={() => void copyCaption()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-xs font-black sm:text-sm">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy caption"}</button></div></div>

          <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(360px,680px)_minmax(260px,1fr)]">
            <div>
              <div className="relative mx-auto aspect-square w-full max-w-[680px] overflow-hidden rounded-xl bg-black shadow-[0_30px_90px_rgba(0,0,0,.5)] ring-1 ring-white/15"><div ref={(node) => { svgRef.current = node?.querySelector("svg") || null; }} className="h-full w-full"><InstagramArtwork slide={slide} index={slideIndex} total={carousel.slides.length} /></div></div>
              <div className="mt-4 flex items-center gap-3"><button onClick={() => setSlideIndex((value) => Math.max(0, value - 1))} disabled={slideIndex === 0} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 disabled:opacity-25"><ArrowLeft className="h-4 w-4" /></button><button onClick={() => setSlideIndex((value) => Math.min(carousel.slides.length - 1, value + 1))} disabled={slideIndex === carousel.slides.length - 1} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black disabled:opacity-25"><ArrowRight className="h-4 w-4" /></button><div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#e5162a] transition-all" style={{ width: `${progress}%` }} /></div><span className="font-mono text-[10px] text-white/35">{slideIndex + 1} / {carousel.slides.length}</span></div>
              <div ref={allSlidesRef} className="mt-4 flex gap-2 overflow-x-auto pb-2">{carousel.slides.map((item, index) => <button key={index} onClick={() => setSlideIndex(index)} aria-label={`Open slide ${index + 1}`} className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border ${index === slideIndex ? "border-[#e5162a]" : "border-white/10 opacity-55 hover:opacity-100"}`}><InstagramArtwork slide={item} index={index} total={carousel.slides.length} /></button>)}</div>
            </div>

            <aside className="rounded-xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ff7d87]">Instagram caption</p><p className="mt-1 text-xs text-white/35">Ready to paste after uploading the ZIP images in order.</p></div><button onClick={() => void copyCaption()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold">{copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy caption"}</button></div><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-white/60">{carousel.caption}</p><div className="mt-6 border-t border-white/10 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Publishing order</p><ol className="mt-3 space-y-2 text-xs leading-5 text-white/45"><li>1. Download the full carousel ZIP.</li><li>2. Upload the numbered PNGs from first to last.</li><li>3. Copy this caption and verify the slide order.</li><li>4. Add a relevant location or collaborator when useful.</li></ol></div></aside>
          </div>
        </div>
      </div>
    </section>
  );
}
