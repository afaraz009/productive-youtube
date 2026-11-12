// Locating video tiles / thumbnails in YouTube's DOM

import {
  THUMBNAIL_ANCHOR_SELECTORS,
  THUMBNAIL_SUMMARY_EXCLUDE_SELECTOR,
  VIDEO_TILE_SELECTORS,
  VIDEO_TILE_TITLE_SELECTORS,
} from "../selectors";

export interface VideoTile {
  tile: Element;
  anchor: HTMLAnchorElement;
  videoId: string;
}

const TILE_SELECTOR = VIDEO_TILE_SELECTORS.join(",");
const ANCHOR_SELECTOR = THUMBNAIL_ANCHOR_SELECTORS.join(",");
const VIDEO_LINK_SELECTOR = 'a[href*="/watch?v="], a[href*="/shorts/"]';
const THUMB_CONTENT_SELECTOR = "img, yt-image, yt-thumbnail-view-model";
// Playlist / mix tiles: summarizing just their first video would be misleading
const COLLECTION_SELECTOR = "yt-collection-thumbnail-view-model, ytd-playlist-thumbnail";

export function videoIdFromHref(href: string | null): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    const id =
      url.searchParams.get("v") ||
      (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function isUsableAnchor(a: Element | null): a is HTMLAnchorElement {
  if (!a || !(a instanceof HTMLAnchorElement)) return false;
  if (a.querySelector(COLLECTION_SELECTOR)) return false;
  const rect = a.getBoundingClientRect();
  return rect.width >= 80 && rect.height >= 45;
}

function findAnchorInTile(tile: Element): HTMLAnchorElement | null {
  const preferred = tile.querySelector(ANCHOR_SELECTOR);
  if (isUsableAnchor(preferred)) return preferred;

  // Fallback for layouts we don't know yet: first video link that wraps a thumbnail image
  for (const a of tile.querySelectorAll(VIDEO_LINK_SELECTOR)) {
    if (a.querySelector(THUMB_CONTENT_SELECTOR) && isUsableAnchor(a)) return a;
  }
  return null;
}

/** Resolve the video tile (and its thumbnail link) under an event target. */
export function findVideoTile(target: Element): VideoTile | null {
  if (target.closest(THUMBNAIL_SUMMARY_EXCLUDE_SELECTOR)) return null;

  let tile: Element | null = target.closest(TILE_SELECTOR);
  let anchor: HTMLAnchorElement | null = tile ? findAnchorInTile(tile) : null;

  if (!anchor) {
    // Unknown container: accept a bare thumbnail link
    const link = target.closest(VIDEO_LINK_SELECTOR);
    if (link && link.querySelector(THUMB_CONTENT_SELECTOR) && isUsableAnchor(link)) {
      anchor = link;
      tile = link;
    }
  }

  if (!tile || !anchor) return null;
  const videoId = videoIdFromHref(anchor.getAttribute("href"));
  return videoId ? { tile, anchor, videoId } : null;
}

export function getTileTitle(tile: Element, anchor: HTMLAnchorElement): string {
  for (const selector of VIDEO_TILE_TITLE_SELECTORS) {
    const el = tile.querySelector(selector);
    const text = (el?.getAttribute("title") || el?.textContent || "").trim();
    if (text) return text.replace(/\s+/g, " ");
  }
  return (anchor.getAttribute("title") || anchor.getAttribute("aria-label") || "").trim();
}

export function getThumbnailImageUrl(anchor: HTMLAnchorElement, videoId: string): string {
  const img = anchor.querySelector("img") as HTMLImageElement | null;
  const src = img?.currentSrc || img?.src || "";
  return src.startsWith("http") ? src : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** True when the anchor still exists, is laid out, and still points at the same video. */
export function anchorStillShows(anchor: HTMLAnchorElement, videoId: string): boolean {
  if (!anchor.isConnected) return false;
  if (videoIdFromHref(anchor.getAttribute("href")) !== videoId) return false;
  const rect = anchor.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
