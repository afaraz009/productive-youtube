// The flip card: front face = the video's thumbnail, back face = the TL;DR panel.
// Lives in a top-level fixed layer (appended to <body>) and tracks the thumbnail's position,
// so YouTube's inline hover preview and thumbnail links can't cover or swallow it.

import type { ThumbnailSummary } from "../types";
import { anchorStillShows, getThumbnailImageUrl, VideoTile } from "./dom";

const MIN_WIDTH = 340;
const MIN_HEIGHT = 260;
const VIEWPORT_MARGIN = 8;
const ANIMATION_MS = 560;

let zCounter = 2147482001;

const ICONS = {
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(icon: string, label: string): HTMLButtonElement {
  const button = el("button", "pyt-ts-action");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon; // static icon markup only, never model output
  return button;
}

export interface SummaryCardCallbacks {
  onClose: (card: SummaryCard) => void;
  onRegenerate: (card: SummaryCard) => void;
  onRetry: (card: SummaryCard) => void;
}

export class SummaryCard {
  readonly videoId: string;
  readonly anchor: HTMLAnchorElement;
  readonly root: HTMLDivElement;
  title: string;
  closed = false;

  private body: HTMLDivElement;
  private titleEl: HTMLSpanElement;
  private copyBtn: HTMLButtonElement;
  private regenBtn: HTMLButtonElement;
  private summary: ThumbnailSummary | null = null;
  private animTimer = 0;

  constructor(tile: VideoTile, title: string, private callbacks: SummaryCardCallbacks) {
    this.videoId = tile.videoId;
    this.anchor = tile.anchor;
    this.title = title;

    this.root = el("div", "pyt-ts-card");
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-label", "Video TL;DR summary");
    this.root.style.zIndex = String(++zCounter);

    const flipper = el("div", "pyt-ts-flipper");
    const front = el("div", "pyt-ts-face pyt-ts-front");
    front.style.backgroundImage = `url("${getThumbnailImageUrl(tile.anchor, tile.videoId)}")`;

    const back = el("div", "pyt-ts-face pyt-ts-back");
    const head = el("div", "pyt-ts-head");
    this.titleEl = el("span", "pyt-ts-title", title);
    this.titleEl.title = title;
    this.copyBtn = actionButton(ICONS.copy, "Copy summary");
    this.regenBtn = actionButton(ICONS.refresh, "Regenerate summary");
    const closeBtn = actionButton(ICONS.close, "Flip back");
    head.append(el("span", "pyt-ts-badge", "TL;DR"), this.titleEl, this.copyBtn, this.regenBtn, closeBtn);

    this.body = el("div", "pyt-ts-body");
    back.append(head, this.body);
    flipper.append(front, back);
    this.root.append(flipper);

    this.copyBtn.addEventListener("click", () => this.copy());
    this.regenBtn.addEventListener("click", () => this.callbacks.onRegenerate(this));
    closeBtn.addEventListener("click", () => this.callbacks.onClose(this));

    this.root.addEventListener("mousedown", () => {
      this.root.style.zIndex = String(++zCounter);
    });
    this.root.addEventListener("mouseenter", () =>
      document.documentElement.classList.add("pyt-ts-over-card")
    );
    this.root.addEventListener("mouseleave", () =>
      document.documentElement.classList.remove("pyt-ts-over-card")
    );
  }

  /** Mount exactly over the thumbnail, then flip + grow to the reading size. */
  open(): void {
    this.applyGeometry(this.anchor.getBoundingClientRect());
    document.body.appendChild(this.root);
    void this.root.offsetWidth; // commit the start state so the transition runs

    this.startAnimating();
    this.root.classList.add("is-flipped");
    this.reposition();
  }

  /** Flip back onto the thumbnail and remove. */
  close(animate = true): void {
    if (this.closed) return;
    this.closed = true;
    document.documentElement.classList.remove("pyt-ts-over-card");

    if (!animate || !anchorStillShows(this.anchor, this.videoId)) {
      this.root.remove();
      return;
    }
    this.startAnimating();
    this.root.classList.remove("is-flipped");
    this.applyGeometry(this.anchor.getBoundingClientRect());
    window.setTimeout(() => this.root.remove(), ANIMATION_MS);
  }

  /** Follow the thumbnail while the page scrolls; returns false if the thumbnail is gone. */
  reposition(): boolean {
    if (this.closed) return false;
    if (!anchorStillShows(this.anchor, this.videoId)) return false;

    const rect = this.anchor.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, MIN_WIDTH), window.innerWidth - VIEWPORT_MARGIN * 2);
    const height = Math.min(Math.max(rect.height, MIN_HEIGHT), window.innerHeight - VIEWPORT_MARGIN * 2);
    const centeredLeft = rect.left + (rect.width - width) / 2;
    const left = Math.min(
      Math.max(centeredLeft, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN
    );

    this.applyGeometry({ left, top: rect.top, width, height });
    return true;
  }

  setTitle(title: string): void {
    if (!title) return;
    this.title = title;
    this.titleEl.textContent = title;
    this.titleEl.title = title;
  }

  renderLoading(status: string): void {
    this.summary = null;
    this.setActionsEnabled(false);
    this.body.replaceChildren();

    const statusRow = el("div", "pyt-ts-status");
    statusRow.append(el("span", "pyt-ts-spinner"), el("span", undefined, status));
    this.body.append(statusRow);
    ["92%", "70%", "84%", "60%", "78%"].forEach((width) => {
      const bar = el("div", "pyt-ts-skeleton");
      bar.style.width = width;
      this.body.append(bar);
    });
  }

  renderSummary(summary: ThumbnailSummary): void {
    this.summary = summary;
    this.setActionsEnabled(true);
    this.body.replaceChildren();
    this.body.scrollTop = 0;

    if (summary.tldr) {
      this.body.append(el("p", "pyt-ts-tldr", summary.tldr));
    }
    summary.sections.forEach((section) => {
      if (section.heading) {
        this.body.append(el("div", "pyt-ts-section-title", section.heading));
      }
      const list = el("ul", "pyt-ts-list");
      section.points.forEach((point) => list.append(el("li", undefined, point)));
      this.body.append(list);
    });
  }

  renderError(message: string, retryable: boolean): void {
    this.summary = null;
    this.setActionsEnabled(false);
    this.body.replaceChildren(el("p", "pyt-ts-error", message));

    if (retryable) {
      const retry = el("button", "pyt-ts-retry", "Try again");
      retry.type = "button";
      retry.addEventListener("click", () => this.callbacks.onRetry(this));
      this.body.append(retry);
    }
  }

  private setActionsEnabled(enabled: boolean): void {
    this.copyBtn.disabled = !enabled;
    this.regenBtn.disabled = !enabled;
  }

  private copy(): void {
    if (!this.summary) return;
    const lines = [this.title, `https://youtu.be/${this.videoId}`, "", `TL;DR: ${this.summary.tldr}`];
    this.summary.sections.forEach((section) => {
      lines.push("", section.heading, ...section.points.map((p) => `- ${p}`));
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      this.copyBtn.innerHTML = ICONS.check;
      window.setTimeout(() => (this.copyBtn.innerHTML = ICONS.copy), 1500);
    });
  }

  private startAnimating(): void {
    this.root.classList.add("is-animating");
    window.clearTimeout(this.animTimer);
    this.animTimer = window.setTimeout(
      () => this.root.classList.remove("is-animating"),
      ANIMATION_MS
    );
  }

  private applyGeometry(r: { left: number; top: number; width: number; height: number }): void {
    const style = this.root.style;
    style.left = `${r.left}px`;
    style.top = `${r.top}px`;
    style.width = `${r.width}px`;
    style.height = `${r.height}px`;

    // Slide under YouTube's sticky masthead instead of covering it
    const masthead = document.getElementById("masthead-container");
    const mastheadBottom = masthead ? masthead.getBoundingClientRect().bottom : 0;
    const hiddenTop = Math.max(0, mastheadBottom - r.top);
    style.visibility = hiddenTop >= r.height || r.top > window.innerHeight ? "hidden" : "";
    style.clipPath = hiddenTop > 0 ? `inset(${hiddenTop}px 0 0 0)` : "";
  }
}
