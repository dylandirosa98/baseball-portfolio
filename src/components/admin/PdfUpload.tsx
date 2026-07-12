"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface PdfUploadProps {
  slug: string;
  currentUrl: string;
  onUpload: (url: string) => void;
}

export default function PdfUpload({ slug, currentUrl, onUpload }: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const hasFile = currentUrl && !currentUrl.includes("placeholder");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Create a free account to upload documents.");

      const path = `${user.id}/${slug || "temp"}/resume.pdf`;

      await supabase.storage.from("player-images").remove([path]);

      const { error } = await supabase.storage
        .from("player-images")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage
        .from("player-images")
        .getPublicUrl(path);

      onUpload(urlData.publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      alert(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onUpload("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => !uploading && fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs hover:border-white/30 hover:text-white/70 transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading..." : hasFile ? "Replace PDF" : "Upload PDF"}
        </button>

        {hasFile && (
          <>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white/70 underline transition-colors"
            >
              View current
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
