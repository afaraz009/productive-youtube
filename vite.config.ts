import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    // don't delete dist/ on each build: content_script.js comes from the other build
    // (vite.content.config.ts). `npm run build` clears dist/ itself first.
    emptyOutDir: false,
    rollupOptions: {
      // the content script is NOT here: it's built on its own by vite.content.config.ts
      // (built together with the popup, shared code would be split out into an import it can't load)
      input: {
        popup: "src/popup.html",
        auth: "src/auth.html",
        background: "src/background.ts",
        chatgpt_automation: "src/scripts/chatgpt-automation.ts",
        gemini_automation: "src/scripts/gemini-automation.ts",
        claude_automation: "src/scripts/claude-automation.ts",
        grok_automation: "src/scripts/grok-automation.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "chatgpt_automation") {
            return "chatgpt_automation.js";
          }
          if (chunkInfo.name === "gemini_automation") {
            return "gemini_automation.js";
          }
          if (chunkInfo.name === "claude_automation") {
            return "claude_automation.js";
          }
          if (chunkInfo.name === "grok_automation") {
            return "grok_automation.js";
          }
          return "[name].js";
        },
        chunkFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "popup.html") {
            return "popup.html";
          }
          if (assetInfo.name === "popup.css") {
            return "popup.css";
          }
          return "[name].[ext]";
        },
      },
    },
    sourcemap: false,
    minify: true,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
