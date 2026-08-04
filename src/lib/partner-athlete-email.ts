import "server-only";
import type { PartnerOrganizationRow } from "@/lib/partners";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function sendPartnerAthleteEmail(input: {
  to: string;
  athleteName: string;
  actionLink: string;
  organization: PartnerOrganizationRow;
  creationMode: "athlete_builds" | "organization_builds";
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured, so the invitation could not be emailed.");

  const whiteLabel = input.organization.partnership_type === "white_label";
  const brandName = whiteLabel ? input.organization.name : "Diamond Profile";
  const color = whiteLabel ? input.organization.primary_color : "#e11d2e";
  const support = whiteLabel && input.organization.support_email
    ? input.organization.support_email
    : "support@diamondprofile.app";
  const preview = input.creationMode === "organization_builds";
  const subject = preview
    ? `${input.athleteName}, your player profile is ready to review`
    : `${input.athleteName}, start building your player profile`;
  const intro = preview
    ? `${input.organization.name} created a draft player profile for you. Review it, securely claim it, and complete checkout if required.`
    : `${input.organization.name} invited you to create your player profile. Your secure link opens the editor so you can add your film, stats, academics, and story.`;
  const button = preview ? "Review my profile" : "Build my profile";
  const configuredFrom = process.env.ACCOUNT_NOTIFICATION_FROM || "Diamond Profile <notifications@diamondprofile.app>";
  const senderAddress = configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom;
  const from = `${brandName} <${senderAddress}>`;
  const logo = whiteLabel && input.organization.logo_url
    ? `<img src="${escapeHtml(input.organization.logo_url)}" alt="${escapeHtml(brandName)}" style="display:block;max-width:72px;max-height:72px;margin:0 0 22px;object-fit:contain">`
    : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      reply_to: support,
      subject,
      text: `${subject}\n\n${intro}\n\n${input.actionLink}\n\nQuestions? ${support}`,
      html: `<div style="margin:0;background:#08090b;padding:32px 16px;font-family:Arial,sans-serif;color:#fff"><div style="max-width:560px;margin:auto;border:1px solid #25262b;border-radius:18px;background:#111216;overflow:hidden"><div style="height:5px;background:${escapeHtml(color)}"></div><div style="padding:32px">${logo}<p style="margin:0 0 22px;color:#aaa;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(brandName)}</p><h1 style="margin:0;font-size:28px;line-height:1.15">${escapeHtml(subject)}</h1><p style="margin:18px 0 26px;color:#c5c5c7;font-size:16px;line-height:1.65">${escapeHtml(intro)}</p><a href="${escapeHtml(input.actionLink)}" style="display:inline-block;background:${escapeHtml(color)};color:#fff;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:9px">${button}</a><p style="margin:28px 0 0;color:#777;font-size:12px;line-height:1.6">This secure sign-in link is for ${escapeHtml(input.to)} and expires. If it expires, request a new one from the invitation page.<br>Questions? ${escapeHtml(support)}</p></div></div></div>`,
    }),
  });
  if (!response.ok) throw new Error(`The invitation email provider returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
}
