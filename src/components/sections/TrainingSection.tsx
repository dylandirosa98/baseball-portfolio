"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@/lib/types";
import VideoModal from "@/components/VideoModal";
import Image from "next/image";
import { detectVideo, getEmbedUrl, getMuxPlaybackId, getMuxThumbnailUrl } from "@/lib/video";

function VideoSlide({ videoItem, themeColor }: { videoItem: { url: string; title?: string; thumbnailUrl?: string; muxPlaybackId?: string }; themeColor: string }) {
  const [showModal, setShowModal] = useState(false);
  const video = detectVideo(videoItem.url);
  const embedUrl = getEmbedUrl(video);
  const muxPlaybackId = getMuxPlaybackId(videoItem.url, videoItem.muxPlaybackId);
  const muxThumbnail = videoItem.thumbnailUrl || (muxPlaybackId ? getMuxThumbnailUrl(muxPlaybackId) : "");

  // Drive folder — show a styled card instead of a broken embed
  if (video.platform === "gdrive-folder") {
    return (
      <div className="w-full">
        <a
          href={videoItem.url}
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
          <p className="text-sm font-semibold text-white/80 text-center mb-1">Training Film Folder</p>
          <p className="text-xs text-white/40 text-center mb-4">Google Drive Folder</p>
          <span className="px-4 py-2 rounded-full text-xs font-medium text-white transition-colors" style={{ backgroundColor: themeColor }}>
            Open Folder →
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        {muxThumbnail ? (
          <Image
            src={muxThumbnail}
            alt="Training video"
            fill
            className="object-cover"
            unoptimized
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl.replace("autoplay=1", "autoplay=0")}
            className="absolute inset-0 w-full h-full pointer-events-none"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}40` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" style={{ color: themeColor }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center opacity-90" style={{ backgroundColor: themeColor }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <VideoModal url={videoItem.url} playbackId={videoItem.muxPlaybackId} title={videoItem.title} isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

export default function TrainingSection({ player, lightMode }: { player: Player; lightMode?: boolean }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const videos = (player.trainingVideos ?? []).filter((v) => v.url?.trim());
  const sharedDescription = player.trainingDescription ?? "";
  const activeTitle = videos[index]?.title?.trim() ?? "";
  const activeDescription = videos[index]?.description?.trim() || sharedDescription;

  if (videos.length === 0 && !activeTitle && !activeDescription) return null;

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }
  function prev() { if (index > 0) go(index - 1); }
  function next() { if (index < videos.length - 1) go(index + 1); }

  return (
    <section className="px-5 py-10 lg:max-w-4xl lg:mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">Training</h2>
          {videos.length > 1 && (
            <span className="ml-auto text-xs text-white/30">{index + 1} / {videos.length}</span>
          )}
        </div>

        {videos.length > 0 && (
          <>
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
                  <VideoSlide videoItem={videos[index]} themeColor={player.themeColor} />
                </motion.div>
              </AnimatePresence>
            </div>

            {videos.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-5">
                <button onClick={prev} disabled={index === 0} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div className="flex gap-1.5">
                  {videos.map((_, i) => (
                    <button key={i} onClick={() => go(i)} className="rounded-full transition-all duration-200"
                      style={{ width: i === index ? "20px" : "6px", height: "6px", backgroundColor: i === index ? "var(--accent)" : lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }} />
                  ))}
                </div>
                <button onClick={next} disabled={index === videos.length - 1} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            )}
          </>
        )}

        {(activeTitle || activeDescription) && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${index}-${activeTitle}-${activeDescription}`}
              className={videos.length > 0 ? "mt-6" : ""}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTitle && (
                <h3 className="text-white/90 text-base lg:text-lg font-semibold mb-2">{activeTitle}</h3>
              )}
              {activeDescription && (
                <p className="text-white/70 text-sm lg:text-base leading-relaxed">{activeDescription}</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </section>
  );
}
