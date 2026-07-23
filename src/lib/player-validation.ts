import type { Player } from "@/lib/types";

const maxPayloadBytes = 512 * 1024;
const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUrl(value: string, allowEmail = false) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (allowEmail && safeEmail.test(trimmed)) return true;

  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:") return true;
    return allowEmail && url.protocol === "mailto:" && safeEmail.test(url.pathname);
  } catch {
    return false;
  }
}

function validateUrlTree(value: unknown, path = "portfolio"): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const error = validateUrlTree(value[index], `${path}[${index}]`);
      if (error) return error;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    const childPath = `${path}.${key}`;
    if ((key === "url" || key.endsWith("Url")) && typeof child === "string") {
      const allowEmail = record.platform === "email";
      if (!safeUrl(child, allowEmail)) return `${childPath} must use a secure https URL.`;
    } else {
      const error = validateUrlTree(child, childPath);
      if (error) return error;
    }
  }
  return null;
}

export function validatePlayerDraft(player: Partial<Player>) {
  const serialized = JSON.stringify(player);
  if (new TextEncoder().encode(serialized).byteLength > maxPayloadBytes) {
    return "This portfolio is too large to save. Remove unused media entries and try again.";
  }

  const boundedText: Array<[string, unknown, number]> = [
    ["First name", player.firstName, 80],
    ["Last name", player.lastName, 80],
    ["Position", player.position, 80],
    ["Team", player.team, 120],
    ["League", player.league, 120],
    ["Hometown", player.hometown, 120],
    ["Biography", player.bio, 5000],
  ];
  for (const [label, value, max] of boundedText) {
    if (typeof value === "string" && value.length > max) return `${label} is too long.`;
  }

  if (player.themeColor && !/^#[0-9a-f]{6}$/i.test(player.themeColor)) {
    return "Choose a valid six-digit theme color.";
  }
  if (player.numberColor && !/^#[0-9a-f]{6}$/i.test(player.numberColor)) {
    return "Choose a valid six-digit number color.";
  }
  if (player.number !== undefined && (!Number.isInteger(player.number) || player.number < 0 || player.number > 999)) {
    return "Player number must be between 0 and 999.";
  }
  if (player.birthYear !== undefined && (!Number.isInteger(player.birthYear) || player.birthYear < 0 || player.birthYear > new Date().getUTCFullYear())) {
    return "Enter a valid birth year.";
  }

  return validateUrlTree(player);
}
