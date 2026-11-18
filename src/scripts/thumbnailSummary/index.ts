// Thumbnail TL;DR: hover any video → "TL;DR" button → thumbnail flips into a Gemini summary.

import { settings } from "../settings";
import type { ThumbnailSummaryResponse } from "../types";
import { SummaryCard } from "./card";
import { anchorStillShows, findVideoTile, getTileTitle, VideoTile } from "./dom";
import { injectThumbnailSummaryStyles } from "./styles";
import { fetchVideoTranscriptText } from "./transcript";

const BUTTON_OFFSET = 8;
const HIDE_DELAY_MS = 180;

let initialized = false;
let button: HTMLButtonElement | null = null;
let hovered: VideoTile | null = null;
let hideTimer = 0;
let rafPending = false;
let watchdog = 0;

const openCards = new Map<string, SummaryCard>();

function sendMessage(message: object): Promise<ThumbnailSummaryResponse> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response: ThumbnailSummaryResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response || { success: false, error: "No response from extension" });
        }
      });
    } catch {
      reject(new Error("The extension was updated. Reload this page to use TL;DR."));
    }
  });
}
//-------------------------------------------------------------------------------------------------------
// ---------- hover button ----------

function createButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pyt-ts-btn";
  btn.title = "Flip for a TL;DR summary";
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z"/></svg><span>TL;DR</span>`;

  btn.addEventListener("mousedown", (e) => e.stopPropagation());
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hovered) openCard(hovered);
  });
  document.body.appendChild(btn);
  return btn;
}

//-------------------------------------------------------------------------------------------------------

function placeButton(): void {
  if (!button || !hovered) return;
  if (
    !settings.thumbnailSummary ||
    openCards.has(hovered.videoId) ||
    !anchorStillShows(hovered.anchor, hovered.videoId)
  ) {
    hideButton();
    return;
  }

  const rect = hovered.anchor.getBoundingClientRect();
  const masthead = document.getElementById("masthead-container");
  const mastheadBottom = masthead ? masthead.getBoundingClientRect().bottom : 0;
  const top = rect.top + BUTTON_OFFSET;
  if (top < mastheadBottom || top > window.innerHeight) {
    button.classList.remove("is-visible");
    return;
  }

  button.style.left = `${rect.left + BUTTON_OFFSET}px`;
  button.style.top = `${top}px`;
  button.classList.add("is-visible");
}

function hideButton(): void {
  window.clearTimeout(hideTimer);
  hovered = null;
  button?.classList.remove("is-visible");
}

function scheduleHide(): void {
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hideButton, HIDE_DELAY_MS);
}

function onMouseOver(e: MouseEvent): void {
  if (!settings.thumbnailSummary) return;
  const target = e.target as Element | null;
  if (!target || !(target instanceof Element)) return;

  // Pointer moved onto our button, or onto YouTube's inline preview of the hovered tile
  if (target === button || button?.contains(target) || target.closest("ytd-video-preview")) {
    window.clearTimeout(hideTimer);
    return;
  }
  if (target.closest(".pyt-ts-card")) {
    scheduleHide();
    return;
  }

  const tile = findVideoTile(target);
  if (!tile) {
    scheduleHide();
    return;
  }

  window.clearTimeout(hideTimer);
  if (!hovered || hovered.anchor !== tile.anchor || hovered.videoId !== tile.videoId) {
    hovered = tile;
  }
  placeButton();
}

// ---------- cards ----------


async function loadSummaryForArticle(card: SummaryCard, force: boolean): Promise<void> {
  try {
    if (!force) {
      const cached = await sendMessage({ type: "GET_ARTICLE", videoId: card.videoId });
      if (card.closed) return;
      if (cached.success && cached.data) {
        card.renderSummary(cached.data);
        return;
      }
    }

    card.renderLoading("Reading transcript…");
    const transcript = await fetchVideoTranscriptText(card.videoId);
    if (card.closed) return;
    if (!transcript) {
      card.renderError("This video has no captions, so there's nothing to summarize.", false);
      return;
    }
    card.setTitle(transcript.title);

    card.renderLoading("Summarizing with Gemini…");
    const result = await sendMessage({
      type: "GET_ARTICLE",
      videoId: card.videoId,
      title: transcript.title || card.title,
      channel: transcript.channel,
      transcript: transcript.text,
    });
    if (card.closed) return;

    if (result.success && result.data) {
      card.renderSummary(result.data);
    } else {
      card.renderError(result.error || "Couldn't generate a summary.", true);
    }
  } catch (error) {
    if (card.closed) return;
    card.renderError(
      error instanceof Error ? error.message : "Couldn't generate a summary.",
      true
    );
  }
}

function closeCard(card: SummaryCard, animate = true): void {
  card.close(animate);
  if (openCards.get(card.videoId) === card) openCards.delete(card.videoId);
  if (openCards.size === 0) stopWatchdog();
}

function openCard(tile: VideoTile): void {
  if (openCards.has(tile.videoId)) return;

  const card = new SummaryCard(tile, getTileTitle(tile.tile, tile.anchor), {
    onClose: (c) => closeCard(c),
    onRegenerate: (c) => loadSummary(c, true),
    onRetry: (c) => loadSummary(c, false),
  });
  openCards.set(tile.videoId, card);
  hideButton();

  card.renderLoading("Loading…");
  card.open();
  startWatchdog();
  loadSummary(card, false);
}

/** Keep cards glued to their thumbnails; drop any whose tile was removed or recycled. */
function repositionAll(): void {
  rafPending = false;
  openCards.forEach((card) => {
    if (!card.reposition()) closeCard(card, false);
  });
  if (hovered) placeButton();
}

function scheduleReposition(): void {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(repositionAll);
}

// YouTube re-renders tiles without scrolling (filters, lazy loads), so check periodically too
function startWatchdog(): void {
  if (!watchdog) watchdog = window.setInterval(scheduleReposition, 1000);
}

function stopWatchdog(): void {
  window.clearInterval(watchdog);
  watchdog = 0;
}

// ---------- public API (used by content.ts) ----------

export function initThumbnailSummary(): void {
  if (initialized) return;
  initialized = true;

  injectThumbnailSummaryStyles();
  button = createButton();

  document.addEventListener("mouseover", onMouseOver, { capture: true, passive: true });
  document.addEventListener(
    "mouseout",
    (e) => {
      if (!e.relatedTarget) scheduleHide(); // pointer left the window
    },
    { capture: true, passive: true }
  );
  window.addEventListener("scroll", scheduleReposition, { capture: true, passive: true });
  window.addEventListener("resize", scheduleReposition, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || openCards.size === 0) return;
    const newest = Array.from(openCards.values()).pop();
    if (newest) closeCard(newest);
  });
}

export function closeAllSummaryCards(): void {
  openCards.forEach((card) => closeCard(card, false));
  hideButton();
}

/** Called whenever settings change: tear everything down when the feature is turned off. */
export function applyThumbnailSummarySetting(): void {
  //if the thumbnail summary setting is disabled
  if (!settings.thumbnailSummary) closeAllSummaryCards();
}

