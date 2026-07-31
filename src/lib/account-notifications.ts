import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const notificationRecipient = "dylan@diamondprofile.app";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function notifyNewAccount(user: User) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("New-account email skipped because RESEND_API_KEY is not configured.");
    return false;
  }

  const email = user.email || "No email supplied";
  const admin = createAdminClient();
  const { error: claimError } = await admin.from("account_notification_events").insert({
    user_id: user.id,
    email,
  });
  if (claimError?.code === "23505") return false;
  if (claimError) throw claimError;

  const provider = String(user.app_metadata?.provider || "email");
  const createdAt = user.created_at || new Date().toISOString();
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://diamondprofile.app"}/admin`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ACCOUNT_NOTIFICATION_FROM || "Diamond Profile <notifications@diamondprofile.app>",
      to: [notificationRecipient],
      subject: `New Diamond Profile account: ${email}`,
      text: `A new Diamond Profile account was created.\n\nEmail: ${email}\nProvider: ${provider}\nCreated: ${createdAt}\nUser ID: ${user.id}\n\nAdmin: ${adminUrl}`,
      html: `<h2>New Diamond Profile account</h2><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Provider:</strong> ${escapeHtml(provider)}</p><p><strong>Created:</strong> ${escapeHtml(createdAt)}</p><p><strong>User ID:</strong> ${escapeHtml(user.id)}</p><p><a href="${escapeHtml(adminUrl)}">Open Diamond Profile Admin</a></p>`,
    }),
  });

  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    await admin.from("account_notification_events").delete().eq("user_id", user.id);
    throw new Error(`Resend rejected new-account notification (${response.status}): ${message}`);
  }

  await admin.from("account_notification_events").update({ sent_at: new Date().toISOString() }).eq("user_id", user.id);
  return true;
}
