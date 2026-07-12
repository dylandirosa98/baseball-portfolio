"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import { Player, Skillset } from "@/lib/types";
import VideoModal from "@/components/VideoModal";
import { detectVideo, getEmbedUrl, getMuxPlaybackId, getMuxThumbnailUrl } from "@/lib/video";

function getSkillVideos(skill: Skillset) {
  if (skill.videos && skill.videos.length > 0) return skill.videos.filter((video) => video.url?.trim() || video.muxPlaybackId?.trim());
  if (skill.watchUrl?.trim() || skill.muxPlaybackId?.trim()) {
    return [
      {
        type: "video" as const,
        url: skill.watchUrl ?? "",
        title: skill.name,
        thumbnailUrl: skill.thumbnailUrl,
        muxPlaybackId: skill.muxPlaybackId,
        muxAssetId: skill.muxAssetId,
        muxUploadId: skill.muxUploadId,
      },
    ];
  }
  return [];
}

function SkillVideo({ skill, themeColor }: { skill: Skillset; themeColor: string }) {
  const [showModal, setShowModal] = useState(false);
  const [index, setIndex] = useState(0);
  const videos = getSkillVideos(skill);
  const activeVideo = videos[index] ?? videos[0];
  const url = activeVideo?.url ?? "";
  const video = detectVideo(url);
  const embedUrl = getEmbedUrl(video);
  const muxPlaybackId = getMuxPlaybackId(url, activeVideo?.muxPlaybackId);
  const thumbnailUrl = activeVideo?.thumbnailUrl || (muxPlaybackId ? getMuxThumbnailUrl(muxPlaybackId) : "");
  const display = skill.videoDisplay ?? "button";

  if (!activeVideo) return null;

  function go(next: number) {
    setIndex(Math.max(0, Math.min(videos.length - 1, next)));
  }

  const controls = videos.length > 1 && (
    <div className="mt-3 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => go(index - 1)}
        disabled={index === 0}
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <span className="text-[10px] text-white/35 tabular-nums">{index + 1} / {videos.length}</span>
      <button
        type="button"
        onClick={() => go(index + 1)}
        disabled={index === videos.length - 1}
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );

  if (display === "embed") {
    return (
      <div className="mt-4">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          {muxPlaybackId ? (
            <MuxPlayer
              key={muxPlaybackId}
              playbackId={muxPlaybackId}
              metadata={{ video_title: activeVideo.title || skill.name || "Player profile video" }}
              className="absolute inset-0 h-full w-full"
              style={{ height: "100%", width: "100%" }}
            />
          ) : embedUrl ? (
            <iframe
              key={url}
              src={embedUrl.replace("autoplay=1", "autoplay=0")}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="absolute inset-0 flex items-center justify-center bg-white/5 group"
            >
              {thumbnailUrl && (
                <Image src={thumbnailUrl} alt={activeVideo.title ?? skill.name} fill className="object-cover" unoptimized />
              )}
              <span className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </button>
          )}
        </div>
        {controls}
        <VideoModal url={url} playbackId={activeVideo.muxPlaybackId} title={activeVideo.title ?? skill.name} isOpen={showModal} onClose={() => setShowModal(false)} />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch Here
        </button>
        {videos.length > 1 && <span className="text-[10px] text-white/35 tabular-nums">{index + 1} / {videos.length}</span>}
      </div>
      {videos.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === index ? 18 : 6, backgroundColor: i === index ? themeColor : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
      )}
      <VideoModal url={url} playbackId={activeVideo.muxPlaybackId} title={activeVideo.title ?? skill.name} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default function SkillsetsSection({ player }: { player: Player }) {
  const skills = (player.skillsets ?? []).filter((s) => s && typeof s === "object" && s.name?.trim());
  if (skills.length === 0) return null;

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
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">
            Player Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map((skill, i) => (
            <motion.div
              key={i}
              className="rounded-xl p-5 border border-white/5 bg-white/[0.03]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.themeColor }}
                />
                <h3 className="text-sm font-bold text-white">{skill.name}</h3>
              </div>
              {skill.description.trim() && (
                <p className="text-xs text-white/50 leading-relaxed">{skill.description}</p>
              )}
              <SkillVideo skill={skill} themeColor={player.themeColor} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
