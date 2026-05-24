import React from "react";
import { createRoot } from "react-dom/client";
import PopupApp from "./components/PopupApp";
import "../styles/index.css";

// PROTOTYPE — under `vite` dev server (npm run dev), mount the variant shell
// so we can flip between UI mockups. Production builds ship the real PopupApp only.
const isDev = import.meta.env.DEV;
const hasChrome = typeof chrome !== "undefined" && !!chrome.storage?.local;

function mount(content: React.ReactElement) {
  const container = document.getElementById("root");
  if (!container) return;
  // Give the popup some breathing room on a full-window dev page.
  if (isDev && !hasChrome) {
    // Override the 340px html/body width from index.css so the dev page can center the popup.
    const devStyle = document.createElement("style");
    devStyle.textContent = `
      html, body { width: 100% !important; min-height: 100vh; background: #1e293b !important; }
      body { display: flex; justify-content: center; align-items: flex-start; padding: 40px 0 80px; margin: 0; }
      #root { width: 340px; }
    `;
    document.head.appendChild(devStyle);
  }
  const root = createRoot(container);
  root.render(content);
}

async function bootstrap() {
  // Theme: read from chrome.storage if available, otherwise system preference.
  let theme: "light" | "dark" = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  if (hasChrome) {
    theme = await new Promise<"light" | "dark">((resolve) => {
      chrome.storage.local.get("theme", (r) => {
        resolve((r.theme as "light" | "dark") || theme);
      });
    });
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-theme", theme);

  if (isDev) {
    // Lazy-load so the prototype shell never lands in production bundles.
    const { default: PrototypeShell } = await import("./prototype/PrototypeShell");
    mount(<PrototypeShell />);
  } else {
    mount(<PopupApp />);
  }
}

bootstrap();
