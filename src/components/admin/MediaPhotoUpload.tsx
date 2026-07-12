"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle } from "lucide-react";

interface MediaPhotoUploadProps {
  slug: string;
  index: number;
  currentUrl: string;
  onUpload: (url: string) => void;
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

export default function MediaPhotoUpload({ slug, index, currentUrl, onUpload }: MediaPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  async function handleFile(file: File) {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    setError("");

    try {
      const needsConversion = ["image/avif", "image/heic", "image/heif"].includes(file.type);
      const uploadBlob = needsConversion ? await toPng(file) : file;
      const formData = new FormData();
      formData.set("file", uploadBlob, needsConversion ? "media.png" : file.name);
      formData.set("slug", slug || "temp");
      formData.set("kind", "media");
      formData.set("index", String(index));

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "Upload failed");

      const url = data.url as string;
      onUpload(url);
      setPreview(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Try another photo.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  return (
    <div aria-busy={uploading}>
      <button
        type="button"
        onClick={() => !uploading && fileRef.current?.click()}
        disabled={uploading}
        className="group relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-white transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-wait"
      >
        {preview ? (
          <Image src={preview} alt="Media photo preview" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-white/35">
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm font-semibold">Add photo</span>
          </span>
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/75 text-sm font-semibold">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Uploading
          </span>
        ) : preview ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-left text-xs font-semibold opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            Replace photo
          </span>
        ) : null}
      </button>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.08] p-3 text-xs leading-5 text-red-200">
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}
