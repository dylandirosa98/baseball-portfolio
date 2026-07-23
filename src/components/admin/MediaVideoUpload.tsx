"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import { getMuxPlaybackId, getMuxThumbnailUrl } from "@/lib/video";

interface MediaVideoUploadProps {
  item: MediaItem;
  slug: string;
  inputClass: string;
  labelClass: string;
  onChange: (item: MediaItem) => void;
  allowAudioChoice?: boolean;
}

type FFmpegInstance = {
  load: (config: { coreURL: string; wasmURL: string }) => Promise<unknown>;
  on: (event: "progress", callback: (event: { progress: number }) => void) => void;
  off: (event: "progress", callback: (event: { progress: number }) => void) => void;
  writeFile: (path: string, data: Uint8Array) => Promise<unknown>;
  exec: (args: string[]) => Promise<number>;
  readFile: (path: string) => Promise<Uint8Array | string>;
  deleteFile: (path: string) => Promise<unknown>;
};

type FFmpegWindow = Window & {
  FFmpegWASM?: {
    FFmpeg: new () => FFmpegInstance;
  };
};

let ffmpeg: FFmpegInstance | null = null;
let ffmpegLoaded = false;
let ffmpegScriptPromise: Promise<void> | null = null;

type UploadStatusResponse = {
  uploadStatus?: string;
  assetId?: string | null;
  assetStatus?: string | null;
  playbackId?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  error?: string;
};


async function loadFfmpegScript() {
  const browserWindow = window as FFmpegWindow;
  if (browserWindow.FFmpegWASM) return;

  ffmpegScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="/ffmpeg/ffmpeg.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load FFmpeg")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/ffmpeg/ffmpeg.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load FFmpeg"));
    document.head.appendChild(script);
  });

  await ffmpegScriptPromise;

  if (!browserWindow.FFmpegWASM) {
    throw new Error("FFmpeg did not initialize");
  }
}

async function loadFfmpeg() {
  if (ffmpegLoaded && ffmpeg) return ffmpeg;

  await loadFfmpegScript();
  const browserWindow = window as FFmpegWindow;
  const FFmpeg = browserWindow.FFmpegWASM?.FFmpeg;

  if (!FFmpeg) {
    throw new Error("FFmpeg is unavailable in this browser");
  }

  ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: "/ffmpeg/ffmpeg-core.js",
    wasmURL: "/ffmpeg/ffmpeg-core.wasm",
  });
  ffmpegLoaded = true;
  return ffmpeg;
}

function getVideoExtension(file: File) {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]+$/.test(nameExt)) return nameExt;
  if (file.type.includes("webm")) return "webm";
  if (file.type.includes("quicktime")) return "mov";
  return "mp4";
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Video upload failed";
}

function setProgressSafe(onProgress: (progress: number) => void, progress: number) {
  onProgress(Math.max(0, Math.min(100, Math.round(progress))));
}

async function removeAudioTrack(file: File, onProgress: (progress: number) => void): Promise<File> {
  const ffmpeg = await loadFfmpeg();

  const ext = getVideoExtension(file);
  const inputName = `input.${ext}`;
  const outputName = `muted-${Date.now()}.mp4`;

  onProgress(0);
  const handleProgress = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) {
      setProgressSafe(onProgress, progress * 100);
    }
  };

  ffmpeg.on("progress", handleProgress);

  try {
    await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

    let exitCode = await ffmpeg.exec([
      "-y",
      "-i",
      inputName,
      "-map",
      "0:v:0",
      "-c:v",
      "copy",
      "-an",
      "-movflags",
      "faststart",
      outputName,
    ]);

    if (exitCode !== 0) {
      setProgressSafe(onProgress, 0);
      exitCode = await ffmpeg.exec([
        "-y",
        "-i",
        inputName,
        "-map",
        "0:v:0",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-movflags",
        "faststart",
        outputName,
      ]);
    }

    if (exitCode !== 0) {
      throw new Error("Could not remove audio from this video. Try uploading with audio, or export the clip as MP4 first.");
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const mutedBlob = new Blob([buffer], { type: "video/mp4" });
    const mutedName = file.name.replace(/(\.[^.]+)?$/, "-muted.mp4");
    return new File([mutedBlob], mutedName, { type: mutedBlob.type });
  } finally {
    ffmpeg.off("progress", handleProgress);
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
    await ffmpeg.deleteFile(outputName).catch(() => undefined);
  }
}

function uploadToMux(uploadUrl: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Video upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Video upload failed"));
    xhr.send(file);
  });
}

async function waitForMuxPlayback(uploadId: string): Promise<UploadStatusResponse> {
  for (let attempt = 0; attempt < 90; attempt++) {
    const response = await fetch(`/api/mux/uploads/${uploadId}`);
    const data = (await response.json()) as UploadStatusResponse;

    if (!response.ok || data.error) {
      throw new Error(data.error || "Unable to check video processing");
    }

    if (data.playbackId && data.url) return data;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Diamond Profile is still processing this video. Try again in a minute.");
}

export default function MediaVideoUpload({ item, slug, inputClass, labelClass, onChange, allowAudioChoice = true }: MediaVideoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const playbackId = getMuxPlaybackId(item.url, item.muxPlaybackId);
  const thumbnailUrl = item.thumbnailUrl || (playbackId ? getMuxThumbnailUrl(playbackId) : "");

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setStatus("Choose a video smaller than 2 GB.");
      return;
    }
    const includeAudio = allowAudioChoice
      ? window.confirm(
          "Include audio in this video upload?\n\nOK = keep original audio\nCancel = permanently remove audio before upload"
        )
      : true;

    setUploading(true);
    setProgress(0);
    setStatus("Preparing video...");

    try {
      let uploadFile = file;

      if (!includeAudio) {
        setStatus("Removing audio...");
        uploadFile = await removeAudioTrack(file, setProgress);
      }

      setProgress(0);
      setStatus("Creating upload...");

      const response = await fetch("/api/mux/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title || uploadFile.name, slug, fileSize: uploadFile.size }),
      });
      const upload = await response.json();

      if (!response.ok || upload.error) {
        throw new Error(upload.error || "Unable to create video upload");
      }

      onChange({ ...item, muxUploadId: upload.uploadId });
      setStatus("Uploading video...");
      await uploadToMux(upload.uploadUrl, uploadFile, setProgress);

      setStatus("Processing video...");
      const ready = await waitForMuxPlayback(upload.uploadId);

      onChange({
        ...item,
        url: ready.url || "",
        thumbnailUrl: ready.thumbnailUrl || undefined,
        muxPlaybackId: ready.playbackId || undefined,
        muxAssetId: ready.assetId || undefined,
        muxUploadId: upload.uploadId,
      });
      setStatus("Ready");
    } catch (error) {
      alert(formatError(error));
      setStatus("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Upload Video to Diamond Profile</label>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 transition-colors group ${
            uploading ? "cursor-wait" : "cursor-pointer hover:border-white/30"
          }`}
        >
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={item.title ?? "video thumbnail"} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/30">
              Click to upload video
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 px-6">
              <span className="text-xs text-white">{status || "Uploading..."}</span>
              <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-white/50">{progress}%</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        {allowAudioChoice && (
          <p className="mt-1 text-[10px] text-white/25">After choosing a file, you can keep or permanently remove audio before it uploads to Diamond Profile.</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Video URL <span className="text-white/20 font-normal">(optional fallback)</span></label>
        <input
          className={inputClass}
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value, muxPlaybackId: undefined, muxAssetId: undefined, muxUploadId: undefined, thumbnailUrl: undefined })}
          placeholder="YouTube, Vimeo, Google Drive, or hosted video link"
        />
      </div>
    </div>
  );
}
