"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import { Highlight } from "@/lib/types";
import { detectVideo, getMuxPlaybackId, getMuxThumbnailUrl } from "@/lib/video";

function VideoSlide({ highlight, active }: { highlight: Highlight; active: boolean }) {
  const [playing, setPlaying] = useState(false);
  const video = detectVideo(highlight.url);
  const muxPlaybackId = getMuxPlaybackId(highlight.url, highlight.muxPlaybackId);

  // Reset playing state when slide becomes inactive
  if (!active && playing) setPlaying(false);

  const embed = (() => {
    if (!active) return null;
    if (video.platform === "youtube") {
      if (!playing) {
        return (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group cursor-pointer"
          >
            <Image
              src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
              alt={highlight.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                <svg viewBox="0 0 24 24" fill="#0a0a0a" className="w-7 h-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        );
      }
      return (
        <iframe
          key="playing"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (muxPlaybackId) {
      if (!playing) {
        return (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group cursor-pointer"
          >
            <Image
              src={highlight.thumbnailUrl || getMuxThumbnailUrl(muxPlaybackId)}
              alt={highlight.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
                <svg viewBox="0 0 24 24" fill="#0a0a0a" className="w-7 h-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        );
      }
      return (
        <MuxPlayer
          playbackId={muxPlaybackId}
          metadata={{ video_title: highlight.title || "Highlight" }}
          autoPlay
          className="absolute inset-0 h-full w-full"
          style={{ height: "100%", width: "100%" }}
        />
      );
    }
    if (video.platform === "vimeo") {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${video.id}?title=0&byline=0&portrait=0`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (video.platform === "wistia") {
      return (
        <iframe
          src={`https://fast.wistia.net/embed/iframe/${video.id}?seo=true&videoFoam=false`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      );
    }
    if (video.platform === "gdrive-folder") {
      return (
        <a
          href={highlight.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 group px-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center mb-4 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white/60">
              <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-white/80 text-center mb-1">{highlight.title || "Game Film Folder"}</p>
          <p className="text-xs text-white/40 text-center mb-4">Google Drive Folder</p>
          <span className="px-4 py-2 rounded-full text-xs font-medium text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>
            Open Folder →
          </span>
        </a>
      );
    }
    return (
      <a
        href={highlight.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center bg-white/5 group"
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mx-auto mb-2 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5 text-white/70">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xs text-white/40">Watch Video</span>
        </div>
      </a>
    );
  })();

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {embed}
      </div>
      <p className="mt-3 text-sm font-medium text-white/80 text-center">{highlight.title}</p>
    </div>
  );
}

interface HighlightsSectionProps {
  highlights: Highlight[];
  lightMode?: boolean;
}

export default function HighlightsSection({ highlights, lightMode }: HighlightsSectionProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (highlights.length === 0) return null;

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function prev() { if (index > 0) go(index - 1); }
  function next() { if (index < highlights.length - 1) go(index + 1); }

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
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">Highlights</h2>
          {highlights.length > 1 && (
            <span className="ml-auto text-xs text-white/30">{index + 1} / {highlights.length}</span>
          )}
        </div>

        {/* Carousel */}
        <div
          className="relative overflow-hidden"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (diff > 50) next();
            else if (diff < -50) prev();
            touchStartX.current = null;
          }}
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <VideoSlide highlight={highlights[index]} active={true} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        {highlights.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              onClick={prev}
              disabled={index === 0}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {highlights.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === index ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === index ? "var(--accent)" : lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={index === highlights.length - 1}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}
