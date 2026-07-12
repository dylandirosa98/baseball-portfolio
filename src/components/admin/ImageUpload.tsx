"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Upload } from "lucide-react";

interface ImageUploadProps {
  slug: string;
  folder: "headshot" | "hero" | "logo";
  currentUrl: string;
  onUpload: (url: string) => void;
}

const acceptedImages = "image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif";

export default function ImageUpload({ slug, folder, currentUrl, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const bgRemovalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (folder !== "hero" && folder !== "logo") return;
    import("@imgly/background-removal").then(({ preload }) =>
      preload({ proxyToWorker: true }).catch(() => {})
    );
  }, [folder]);

  async function uploadImage(file: Blob, kind: "headshot" | "hero" | "logo", filename: string) {
    const formData = new FormData();
    formData.set("file", file, filename);
    formData.set("slug", slug || "temp");
    formData.set("kind", kind);

    const response = await fetch("/api/images/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Upload failed");
    }

    return data.url as string;
  }

  async function uploadDirect(file: File, heroPath?: boolean) {
    const needsConversion = ["image/avif", "image/heic", "image/heif"].includes(file.type);
    const uploadBlob = needsConversion ? await toPng(file) : file;
    const filename = needsConversion ? `${folder}.png` : file.name;
    return uploadImage(uploadBlob, heroPath ? "hero" : folder, filename);
  }

  async function toPng(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d")?.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image conversion failed")), "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("That image could not be opened"));
      };
      image.src = url;
    });
  }

  async function uploadWithBgRemoval(file: File) {
    const { removeBackground } = await import("@imgly/background-removal");
    const pngBlob = await toPng(file);
    const resultBlob = await removeBackground(pngBlob, {
      proxyToWorker: true,
      progress: (key, current, total) => {
        if (key.includes("fetch") && total > 0) {
          setProgress(Math.round((current / total) * 100));
          setStatus("Preparing background remover");
        } else if (key.includes("compute")) {
          setProgress(0);
          setStatus("Removing background");
        }
      },
    });

    return uploadImage(resultBlob, folder === "logo" ? "logo" : "hero", `${folder === "logo" ? "logo" : "hero"}.png`);
  }

  async function handleFile(file: File, removeBackground: boolean) {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    setError("");
    setProgress(0);

    try {
      let url: string;
      if (removeBackground) {
        setStatus("Preparing background remover");
        url = await uploadWithBgRemoval(file);
      } else {
        setStatus("Uploading photo");
        url = await uploadDirect(file, folder === "hero");
      }
      onUpload(url);
      setPreview(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Try another photo.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
      setStatus("");
      setProgress(0);
    }
  }

  function selectFile(removeBackground: boolean) {
    setError("");
    if (removeBackground) {
      bgRemovalRef.current?.click();
    } else {
      fileRef.current?.click();
    }
  }

  const hasImage = !!preview && !preview.includes("placeholder");
  const isCutout = folder === "hero" || folder === "logo";

  return (
    <div aria-busy={uploading}>
      <div className="flex items-start gap-3">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          {hasImage ? (
            <Image
              src={preview}
              alt={folder === "logo" ? "Team logo preview" : "Player photo preview"}
              fill
              className={folder === "headshot" ? "object-cover" : "object-contain"}
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">No photo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-2">
              <LoaderCircle className="h-5 w-5 animate-spin text-white" />
              <span className="text-center text-[10px] leading-4 text-white/75">
                {status}{progress > 0 ? ` ${progress}%` : ""}
              </span>
              {progress > 0 && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {isCutout ? (
            <>
              <button
                type="button"
                onClick={() => selectFile(true)}
                disabled={uploading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-black transition hover:bg-white/85 disabled:opacity-50"
              >
                Upload and remove background
              </button>
              <button
                type="button"
                onClick={() => selectFile(false)}
                disabled={uploading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                Upload original
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => selectFile(false)}
              disabled={uploading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-black transition hover:bg-white/85 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {hasImage ? "Replace photo" : "Upload photo"}
            </button>
          )}
          <p className="text-xs leading-4 text-white/30">{isCutout ? "The background is removed automatically." : "JPG, PNG, WEBP, HEIC, or AVIF"}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.08] p-3 text-xs leading-5 text-red-200">
          {error}
        </p>
      )}

      <input
        ref={bgRemovalRef}
        type="file"
        accept={acceptedImages}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file, true);
          event.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={fileRef}
        type="file"
        accept={acceptedImages}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file, false);
          event.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
