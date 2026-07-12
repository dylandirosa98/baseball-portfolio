"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MuxPlayer from "@mux/mux-player-react";
import { detectVideo, getEmbedUrl, getMuxPlaybackId, type VideoInfo } from "@/lib/video";

function isFolder(video: VideoInfo) {
  return video.platform === "gdrive-folder";
}

interface VideoModalProps {
  url?: string;
  playbackId?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ url = "", playbackId, title, isOpen, onClose }: VideoModalProps) {
  const video = detectVideo(url);
  const embedUrl = getEmbedUrl(video);
  const folder = isFolder(video);
  const muxPlaybackId = getMuxPlaybackId(url, playbackId);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/90"
            onClick={onClose}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <motion.div
            className={`relative w-full z-10 rounded-xl overflow-hidden bg-black ${folder ? "max-w-2xl h-[70vh]" : "max-w-4xl aspect-video"}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {muxPlaybackId ? (
              <MuxPlayer
                playbackId={muxPlaybackId}
                metadata={{ video_title: title || "Player video" }}
                autoPlay
                className="absolute inset-0 h-full w-full"
                style={{ height: "100%", width: "100%" }}
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    Open video in new tab
                  </a>
                ) : (
                  <span className="text-white/40 text-sm">Video is still processing</span>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
