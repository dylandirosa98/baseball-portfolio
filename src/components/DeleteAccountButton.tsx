"use client";

import { useState } from "react";

export default function DeleteAccountButton() {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function removeAccount() {
    const confirmed = window.confirm("Permanently delete your Diamond Profile account and portfolio? This cannot be undone. Keep original copies of every photo, video, and document first.");
    if (!confirmed) return;
    const typed = window.prompt('Type DELETE to confirm permanent account deletion.');
    if (typed !== "DELETE") return;

    setState("loading");
    setMessage("");
    const response = await fetch("/api/account", { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "Your account could not be deleted.");
      return;
    }
    window.location.assign("/?account=deleted");
  }

  return (
    <div className="mt-10 border-t border-red-400/15 pt-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-300/60">Danger zone</p>
      <p className="mt-2 text-sm leading-6 text-white/40">Deletion permanently removes the portfolio and uploaded files. Active subscriptions must be canceled first.</p>
      <button type="button" onClick={removeAccount} disabled={state === "loading"} className="mt-4 min-h-11 rounded-lg border border-red-400/25 px-4 text-sm font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50">{state === "loading" ? "Deleting…" : "Delete account"}</button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-red-300">{message}</p>}
    </div>
  );
}
