"use client";

import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";

export default function AthleteInvitationAccess({ token, color }: { token: string; color: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    setState("sending");
    setMessage("");
    const response = await fetch(`/api/partner/invitations/${token}/access`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "The secure link could not be sent.");
      return;
    }
    setState("sent");
    setMessage("Check your email for a secure sign-in link.");
  }

  return (
    <div>
      <button type="button" disabled={state === "sending" || state === "sent"} onClick={() => void send()} style={{ backgroundColor: color }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-60">
        {state === "sending" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {state === "sent" ? "Secure link sent" : "Email me a secure sign-in link"}
      </button>
      {message && <p className={`mt-4 rounded-lg border p-3 text-sm ${state === "error" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>{message}</p>}
    </div>
  );
}
