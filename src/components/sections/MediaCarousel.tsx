"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { MediaItem } from "@/lib/types";
import { detectVideo, getMuxPlaybackId, getMuxThumbnailUrl, hasMediaSource } from "@/lib/video";
import VideoModal from "@/components/VideoModal";

function MediaSlide({ item, accentColor }: { item: MediaItem; accentColor: string }) {
  const [showModal, setShowModal] = useState(false);

  if (item.type === "photo") {
    return (
      <div className="w-full">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5">
          <Image src={item.url} alt={item.title ?? ""} fill className="object-cover" unoptimized />
        </div>
        {item.title && (
          <p className="mt-3 text-sm font-medium text-white/60 text-center">{item.title}</p>
        )}
      </div>
    );
  }

  const video = detectVideo(item.url || "");
  const muxPlaybackId = getMuxPlaybackId(item.url, item.muxPlaybackId);
  const muxThumbnail = item.thumbnailUrl || (muxPlaybackId ? getMuxThumbnailUrl(muxPlaybackId) : "");

  if (video.platform === "gdrive-folder") {
    return (
      <div className="w-full">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 flex flex-col items-center justify-center group px-6"
          style={{ display: "flex" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center mb-4 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white/60">
              <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          {item.title && <p className="text-sm font-semibold text-white/80 text-center mb-1">{item.title}</p>}
          <p className="text-xs text-white/40 text-center mb-4">Google Drive Folder</p>
          <span className="px-4 py-2 rounded-full text-xs font-medium text-white transition-colors" style={{ backgroundColor: accentColor }}>
            Open Folder →
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        {muxThumbnail ? (
          <Image
            src={muxThumbnail}
            alt={item.title ?? ""}
            fill
            className="object-cover"
            unoptimized
          />
        ) : video.platform === "youtube" ? (
          <Image
            src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
            alt={item.title ?? ""}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-white/5" />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      {item.title && (
        <p className="mt-3 text-sm font-medium text-white/60 text-center">{item.title}</p>
      )}
      <VideoModal url={item.url} playbackId={item.muxPlaybackId} title={item.title} isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

interface MediaCarouselProps {
  items: MediaItem[];
  accentColor: string;
  lightMode?: boolean;
}

export default function MediaCarousel({ items, accentColor, lightMode }: MediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const valid = (items ?? []).filter(hasMediaSource);
  if (valid.length === 0) return null;

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }
  function prev() { if (index > 0) go(index - 1); }
  function next() { if (index < valid.length - 1) go(index + 1); }

  return (
    <div>
      {valid.length > 1 && (
        <div className="flex justify-end mb-3">
          <span className="text-xs text-white/30">{index + 1} / {valid.length}</span>
        </div>
      )}

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
            <MediaSlide item={valid[index]} accentColor={accentColor} />
          </motion.div>
        </AnimatePresence>
      </div>

      {valid.length > 1 && (
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
          <div className="flex gap-1.5">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === index ? "20px" : "6px",
                  height: "6px",
                  backgroundColor: i === index ? accentColor : lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            disabled={index === valid.length - 1}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
