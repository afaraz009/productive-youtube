import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "src/popup.html",
        content: "src/content.ts",
        background: "src/background.ts",
        chatgpt_automation: "src/features/automation/chatgpt-automation.ts",
        gemini_automation: "src/features/automation/gemini-automation.ts",
        claude_automation: "src/features/automation/claude-automation.ts",
        grok_automation: "src/features/automation/grok-automation.ts",
        blocker: "src/styles/blocker.css",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "content") {
            return "content_script.js";
          }
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
