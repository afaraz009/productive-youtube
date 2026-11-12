// Stylesheet for the thumbnail TL;DR button and flip card (injected once into the page)

const STYLE_ID = "pyt-ts-styles";

const CSS = `
.pyt-ts-btn, .pyt-ts-card {
  --pyt-accent: #2563eb;
  --pyt-accent-2: #7c3aed;
  --pyt-bg: #ffffff;
  --pyt-fg: #0f172a;
  --pyt-muted: #64748b;
  --pyt-border: rgba(15, 23, 42, 0.12);
  --pyt-hover: rgba(15, 23, 42, 0.07);
  --pyt-skeleton: rgba(15, 23, 42, 0.08);
  font-family: "Roboto", "Arial", sans-serif;
  -webkit-font-smoothing: antialiased;
}
html[dark] .pyt-ts-btn, html[dark] .pyt-ts-card {
  --pyt-accent: #60a5fa;
  --pyt-accent-2: #a78bfa;
  --pyt-bg: #1c1c1f;
  --pyt-fg: #f1f5f9;
  --pyt-muted: #94a3b8;
  --pyt-border: rgba(255, 255, 255, 0.12);
  --pyt-hover: rgba(255, 255, 255, 0.09);
  --pyt-skeleton: rgba(255, 255, 255, 0.09);
}

/* Hover button */
.pyt-ts-btn {
  position: fixed;
  z-index: 2147482000;
  display: none;
  align-items: center;
  gap: 4px;
  padding: 5px 10px 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(15, 15, 15, 0.82);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  opacity: 0;
}
.pyt-ts-btn.is-visible { display: inline-flex; opacity: 1; }
.pyt-ts-btn:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  transform: translateY(-1px);
}
.pyt-ts-btn svg { width: 13px; height: 13px; }

/* Flip card */
.pyt-ts-card {
  position: fixed;
  z-index: 2147482001;
  perspective: 1400px;
  color: var(--pyt-fg);
}
.pyt-ts-card.is-animating {
  transition: left 0.45s cubic-bezier(.2,.7,.2,1), top 0.45s cubic-bezier(.2,.7,.2,1),
    width 0.45s cubic-bezier(.2,.7,.2,1), height 0.45s cubic-bezier(.2,.7,.2,1);
}
.pyt-ts-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(.2,.7,.2,1);
}
.pyt-ts-card.is-flipped .pyt-ts-flipper { transform: rotateY(180deg); }
.pyt-ts-face {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.pyt-ts-front {
  background-color: #000;
  background-size: cover;
  background-position: center;
}
/* Once the flip has finished, drop the front face so nothing can bleed through */
.pyt-ts-card.is-flipped:not(.is-animating) .pyt-ts-front { visibility: hidden; }
.pyt-ts-back {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  background: var(--pyt-bg);
  border: 1px solid var(--pyt-border);
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.45), 0 6px 16px -8px rgba(0, 0, 0, 0.3);
}

.pyt-ts-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 6px 6px 10px;
  border-bottom: 1px solid var(--pyt-border);
  flex-shrink: 0;
}
.pyt-ts-badge {
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--pyt-accent), var(--pyt-accent-2));
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.pyt-ts-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  color: var(--pyt-muted);
}
.pyt-ts-action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--pyt-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.pyt-ts-action:hover { background: var(--pyt-hover); color: var(--pyt-fg); }
.pyt-ts-action:disabled { opacity: 0.35; cursor: default; background: transparent; }
.pyt-ts-action svg { width: 15px; height: 15px; }

.pyt-ts-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 9px 12px 12px;
  font-size: 12.5px;
  line-height: 1.45;
  scrollbar-width: thin;
}
.pyt-ts-tldr {
  margin: 0 0 8px;
  padding: 1px 0 1px 9px;
  border-left: 3px solid var(--pyt-accent);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.pyt-ts-section-title {
  margin: 9px 0 2px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--pyt-accent);
}
.pyt-ts-list { margin: 0; padding: 0 0 0 15px; }
.pyt-ts-list li { margin: 2px 0; padding-left: 1px; }
.pyt-ts-list li::marker { color: var(--pyt-accent); }

.pyt-ts-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--pyt-muted);
}
.pyt-ts-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid var(--pyt-skeleton);
  border-top-color: var(--pyt-accent);
  border-radius: 50%;
  animation: pyt-ts-spin 0.8s linear infinite;
}
.pyt-ts-skeleton {
  height: 9px;
  margin: 8px 0;
  border-radius: 5px;
  background: linear-gradient(90deg, var(--pyt-skeleton) 25%, var(--pyt-hover) 50%, var(--pyt-skeleton) 75%);
  background-size: 200% 100%;
  animation: pyt-ts-shimmer 1.2s ease-in-out infinite;
}
.pyt-ts-error { margin: 0 0 10px; color: var(--pyt-fg); }
.pyt-ts-retry {
  padding: 6px 12px;
  border: 1px solid var(--pyt-border);
  border-radius: 8px;
  background: transparent;
  color: var(--pyt-accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.pyt-ts-retry:hover { background: var(--pyt-hover); }

@keyframes pyt-ts-spin { to { transform: rotate(360deg); } }
@keyframes pyt-ts-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Keep YouTube's inline hover preview from flashing under an open card */
html.pyt-ts-over-card ytd-video-preview { opacity: 0 !important; pointer-events: none !important; }

@media (prefers-reduced-motion: reduce) {
  .pyt-ts-card.is-animating, .pyt-ts-flipper, .pyt-ts-btn { transition: none !important; }
}
`;

export function injectThumbnailSummaryStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
}
