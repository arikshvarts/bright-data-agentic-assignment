import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { CreatorProfile } from "./types.js";
import { repairText } from "./textRepair.js";

const profileSchema = z.object({
  businessName: z.string().min(1),
  profile: z.string().min(1),
  niche: z.string().min(1),
  audience: z.string().min(1),
  location: z.string().min(1),
  language: z.string().min(1),
  goal: z.string().min(1),
  capabilities: z.array(z.string().min(1)).min(1)
});

export type ProfileInput = {
  businessName?: string;
  profile?: string;
  profileFile?: string;
  niche?: string;
  audience?: string;
  location?: string;
  language?: string;
  goal?: string;
  capabilities?: string[];
};

export async function loadCreatorProfile(input: ProfileInput): Promise<CreatorProfile> {
  const fileProfile = input.profileFile ? await readProfileFile(input.profileFile) : {};
  const merged = {
    ...defaultProfile(),
    ...fileProfile,
    businessName: input.businessName ?? fileProfile.businessName ?? defaultProfile().businessName,
    profile: input.profile ?? fileProfile.profile ?? defaultProfile().profile,
    niche: input.niche ?? fileProfile.niche ?? defaultProfile().niche,
    audience: input.audience ?? fileProfile.audience ?? defaultProfile().audience,
    location: input.location ?? fileProfile.location ?? defaultProfile().location,
    language: input.language ?? fileProfile.language ?? defaultProfile().language,
    goal: input.goal ?? fileProfile.goal ?? defaultProfile().goal,
    capabilities: input.capabilities?.length ? input.capabilities : fileProfile.capabilities ?? defaultProfile().capabilities
  };

  const parsed = profileSchema.parse(merged);
  return {
    ...parsed,
    businessName: repairText(parsed.businessName),
    profile: repairText(parsed.profile),
    niche: repairText(parsed.niche),
    audience: repairText(parsed.audience),
    location: repairText(parsed.location),
    language: repairText(parsed.language),
    goal: repairText(parsed.goal),
    capabilities: parsed.capabilities.map(repairText)
  };
}

export function defaultProfile(): CreatorProfile {
  return {
    businessName: "Nook & Pour",
    profile: "A cozy independent specialty coffee shop with pastries, two quiet work tables, and a warm neighborhood feel.",
    niche: "specialty coffee, pastries, cozy work/study spot",
    audience: "students, remote workers, young professionals",
    location: "Tel Aviv, Israel",
    language: "English",
    goal: "increase weekday visits",
    capabilities: [
      "phone-shot vertical video",
      "staff can appear on camera",
      "can film drinks and pastries",
      "no paid creator budget",
      "can post TikTok and Instagram Reels"
    ]
  };
}

async function readProfileFile(profileFile: string): Promise<Partial<CreatorProfile>> {
  const raw = await readFile(profileFile, "utf8");
  if (profileFile.toLowerCase().endsWith(".json")) {
    return profileSchema.partial().parse(JSON.parse(raw));
  }
  return parseLooseMarkdownProfile(raw);
}

function parseLooseMarkdownProfile(raw: string): Partial<CreatorProfile> {
  const result: Partial<CreatorProfile> = {};
  const aliases: Record<string, keyof CreatorProfile> = {
    business: "businessName",
    "business name": "businessName",
    profile: "profile",
    niche: "niche",
    audience: "audience",
    location: "location",
    language: "language",
    goal: "goal",
    capabilities: "capabilities"
  };

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?([^:]+):\s*(.+)\s*$/);
    if (!match) continue;
    const key = aliases[match[1].trim().toLowerCase()];
    if (!key) continue;
    const value = match[2].trim();
    if (key === "capabilities") result.capabilities = value.split(/[,;]/).map((item) => item.trim()).filter(Boolean);
    else result[key] = value as never;
  }

  return result;
}
