import React from "react";
import { createRoot } from "react-dom/client";
import PopupApp from "./components/PopupApp";
import "../styles/index.css";

const container = document.getElementById("root");
if (container) {
  // Check storage again right before rendering to ensure classes are in sync
  chrome.storage.local.get('theme', (result) => {
    const theme = result.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
    
    const root = createRoot(container);
    root.render(<PopupApp />);
  });
}
