import { demoBlogPosts } from "@/lib/demo-content";
import { mediaUrl } from "@/lib/utils";

const ACCENTS = ["lime", "warm", "green"];

function estimateReadTime(text) {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(2, Math.round(words / 200));
  return `${minutes} min read`;
}

function eventMedia(event) {
  return event?.media?.[0]?.media || event?.coverMedia || null;
}

function attractionMedia(attraction) {
  return attraction?.media || attraction?.coverMedia || null;
}

export function blogPostToArticle(post, index = 0) {
  const title = post?.title || "";
  const description = post?.excerpt || post?.content || "";
  return {
    id: `blog-${post.id || post.slug}`,
    category: post.category || "Journal",
    readTime: estimateReadTime(description),
    title,
    href: `/journal/${post.slug}`,
    accent: ACCENTS[index % ACCENTS.length],
    imageSrc: mediaUrl(post.coverMedia) || "",
    imageAlt: title,
  };
}

function toArticle(item, type, index) {
  const isEvent = type === "event";
  const slug = item.slug;
  const title = item.name;
  const description = item.description || item.shortDescription || "";
  const media = isEvent ? eventMedia(item) : attractionMedia(item);

  return {
    id: `${type}-${item.id || slug}`,
    category: isEvent ? "Events" : "Nearby",
    readTime: estimateReadTime(description),
    title,
    href: isEvent ? `/events/${slug}` : `/attractions/${slug}`,
    accent: ACCENTS[index % ACCENTS.length],
    imageSrc: mediaUrl(media) || "",
    imageAlt: title,
  };
}

/** Journal cards from published blog posts, with optional fallback to events/attractions. */
export function buildJournalArticles({ posts = [], events = [], attractions = [] }, limit = 6) {
  const postList = Array.isArray(posts) ? posts : [];
  const fromPosts = postList.map((post, index) => blogPostToArticle(post, index));

  if (fromPosts.length >= limit) {
    return fromPosts.slice(0, limit);
  }

  const eventList = Array.isArray(events) ? events : [];
  const attractionList = Array.isArray(attractions) ? attractions : [];
  const fallback = [
    ...eventList.map((event, index) => toArticle(event, "event", index)),
    ...attractionList.map((item, index) => toArticle(item, "attraction", index + eventList.length)),
  ].filter((article) => article.href && article.title);

  const merged = [...fromPosts, ...fallback];
  if (merged.length >= limit) {
    return merged.slice(0, limit);
  }

  const fromDemo = demoBlogPosts.map((post, index) => blogPostToArticle(post, index + merged.length));
  return [...merged, ...fromDemo].slice(0, limit);
}

export const journalAccentDot = {
  lime: "bg-brand-lime",
  warm: "bg-brand-warm",
  green: "bg-brand-green",
};
