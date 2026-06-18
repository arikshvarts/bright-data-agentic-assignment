import type { ToolClient, TrendEvidence } from "./types.js";
import { repairText } from "./textRepair.js";

type UnknownRecord = Record<string, unknown>;

export async function enrichTikTokEvidence(client: ToolClient, sources: TrendEvidence[]): Promise<TrendEvidence[]> {
  if (/^(0|false|off)$/i.test(process.env.BRIGHT_DATA_SOCIAL_ENRICHMENT ?? "")) return sources;

  const maxPosts = boundedEnvNumber("SOCIAL_ENRICH_MAX_POSTS", 1, 0, 8);
  const maxComments = boundedEnvNumber("SOCIAL_ENRICH_MAX_COMMENTS", 0, 0, maxPosts);
  let postsAttempted = 0;
  let commentsAttempted = 0;
  const enriched: TrendEvidence[] = [];

  for (const source of sources) {
    if (!isDirectTikTokVideo(source.url) || postsAttempted >= maxPosts) {
      enriched.push(source);
      continue;
    }

    postsAttempted += 1;
    let next = source;
    try {
      const rawPost = await client.callTool<unknown>({
        name: "web_data_tiktok_posts",
        args: { url: source.url }
      });
      next = mergePostData(source, rawPost);
    } catch (error) {
      next = {
        ...source,
        structuredDataStatus: "failed",
        qualityNotes: [...(source.qualityNotes ?? []), `structured TikTok post unavailable: ${safeMessage(error)}`]
      };
    }

    if (commentsAttempted < maxComments) {
      commentsAttempted += 1;
      try {
        const rawComments = await client.callTool<unknown>({
          name: "web_data_tiktok_comments",
          args: { url: source.url }
        });
        next = mergeCommentData(next, rawComments);
      } catch (error) {
        next = {
          ...next,
          qualityNotes: [...(next.qualityNotes ?? []), `structured TikTok comments unavailable: ${safeMessage(error)}`]
        };
      }
    }

    enriched.push(next);
  }

  return enriched;
}

function mergePostData(source: TrendEvidence, raw: unknown): TrendEvidence {
  const records = collectRecords(parseMaybeJson(raw));
  const post = records.find(hasPostSignal) ?? records[0];
  if (!post) {
    return {
      ...source,
      structuredDataStatus: "failed",
      qualityNotes: [...(source.qualityNotes ?? []), "structured TikTok post returned no record"]
    };
  }

  const caption = firstString(post, ["description", "caption", "text", "post_text", "video_description", "desc"]);
  const author = firstString(post, ["author_name", "nickname", "username", "user_name", "account_id", "author"]);
  const publishedAt = normalizeDate(firstValue(post, ["create_time", "created_at", "published_at", "date", "timestamp"]));
  const hashtags = extractHashtags(post, caption);
  const structuredText = [
    caption ? `Caption: ${caption}` : "",
    author ? `Creator: ${author}` : "",
    hashtags.length ? `Hashtags: ${hashtags.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...source,
    title: caption ? repairText(caption).slice(0, 180) : source.title,
    content: [source.content, structuredText].filter(Boolean).join("\n\n").slice(0, 7000),
    author: author ? repairText(author) : source.author,
    publishedAt: publishedAt ?? source.publishedAt,
    views: firstNumber(post, ["views", "view_count", "play_count", "plays"]) ?? source.views,
    likes: firstNumber(post, ["likes", "like_count", "digg_count"]) ?? source.likes,
    shares: firstNumber(post, ["shares", "share_count"]) ?? source.shares,
    comments: firstNumber(post, ["comments", "comment_count"]) ?? source.comments,
    hashtags: hashtags.length ? hashtags : source.hashtags,
    videoUrl: firstString(post, ["video_url", "download_url", "play_url", "web_video_url"]) ?? source.videoUrl,
    structuredDataStatus: "ok",
    qualityNotes: [...(source.qualityNotes ?? []), "structured TikTok post data"]
  };
}

function mergeCommentData(source: TrendEvidence, raw: unknown): TrendEvidence {
  const comments = collectRecords(parseMaybeJson(raw))
    .map((record) => {
      const text = firstString(record, ["comment", "text", "content", "comment_text", "description"]);
      const likes = firstNumber(record, ["likes", "like_count", "digg_count"]);
      return text ? { text: repairText(text), likes: likes ?? 0 } : null;
    })
    .filter((comment): comment is { text: string; likes: number } => Boolean(comment))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  if (!comments.length) {
    return {
      ...source,
      qualityNotes: [...(source.qualityNotes ?? []), "structured TikTok comments returned no readable text"]
    };
  }

  const commentInsights = comments.map((comment) => `${comment.text}${comment.likes ? ` (${comment.likes} likes)` : ""}`);
  return {
    ...source,
    content: [source.content, `Audience comments:\n${commentInsights.join("\n")}`].filter(Boolean).join("\n\n").slice(0, 7000),
    commentInsights,
    qualityNotes: [...(source.qualityNotes ?? []), "structured TikTok comment data"]
  };
}

function collectRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.flatMap(collectRecords);
  if (!isRecord(value)) return [];
  const nested = ["data", "results", "items", "comments", "posts"].flatMap((key) => collectRecords(value[key]));
  return Object.values(value).some((item) => typeof item !== "object") ? [value, ...nested] : nested;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function hasPostSignal(record: UnknownRecord): boolean {
  return ["description", "caption", "views", "view_count", "play_count", "author_name", "nickname"].some(
    (key) => record[key] !== undefined
  );
}

function firstString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function firstNumber(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function firstValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function extractHashtags(record: UnknownRecord, caption?: string): string[] {
  const values = ["hashtags", "hashtag_names", "challenges", "tags"].flatMap((key) => normalizeStringArray(record[key]));
  const captionTags = caption?.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set([...values, ...captionTags].map((tag) => tag.replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0, 20);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (!isRecord(item)) return [];
    const value = firstString(item, ["name", "title", "hashtag_name", "tag"]);
    return value ? [value] : [];
  });
}

function normalizeDate(value: unknown): string | undefined {
  if (typeof value === "number") {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && /^\d+$/.test(value)) return normalizeDate(numeric);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

function isDirectTikTokVideo(url: string): boolean {
  return /tiktok\.com\/@[^/]+\/video\/\d+/i.test(url);
}

function boundedEnvNumber(name: string, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/API_TOKEN=[^&\s]+/g, "API_TOKEN=[redacted]")
    .slice(0, 220);
}
