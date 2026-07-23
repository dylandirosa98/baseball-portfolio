"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyProfileLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copyLink()}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-bold text-white/75 transition hover:bg-white/5 hover:text-white"
      aria-live="polite"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
