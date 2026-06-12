import type { Platform } from "./types.js";

export function classifyPlatform(url: string, title = ""): Platform {
  const haystack = `${url} ${title}`.toLowerCase();
  if (/ads\.tiktok\.com|creativecenter|creative\/creativecenter/.test(haystack)) return "creative_center";
  if (/tiktok\.com/.test(haystack)) return "tiktok";
  if (/instagram\.com/.test(haystack)) return "instagram";
  if (/youtube\.com|youtu\.be/.test(haystack)) return "youtube";
  if (/reddit\.com/.test(haystack)) return "reddit";
  if (/(^|\/\/)(x\.com|twitter\.com)/.test(haystack)) return "x";
  if (/google\./.test(haystack)) return "google";
  if (/vogue|businessinsider|brandwatch|exolyt|later\.com|socialinsider|hootsuite|sproutsocial|hubspot/.test(haystack)) return "article";
  return "unknown";
}

export function isSocialPlatform(platform: Platform): boolean {
  return ["tiktok", "instagram", "youtube", "reddit", "x", "creative_center"].includes(platform);
}
