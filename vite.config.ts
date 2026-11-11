import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Chrome injects these as classic scripts, so each must be one
// self-contained file with no imports.
const classicScripts: Record<string, string> = {
  content_script: "src/scripts/content.ts",
  chatgpt_automation: "src/scripts/chatgpt-automation.ts",
  gemini_automation: "src/scripts/gemini-automation.ts",
  claude_automation: "src/scripts/claude-automation.ts",
  grok_automation: "src/scripts/grok-automation.ts",
};

export default defineConfig(({ mode }) => {
  const define = { "process.env.NODE_ENV": '"production"' };

  // `vite build --mode <name>` builds one classic script
  if (classicScripts[mode]) {
    return {
      define,
      build: {
        outDir: "dist",
        emptyOutDir: false,
        copyPublicDir: false,
        sourcemap: false,
        minify: true,
        lib: {
          entry: classicScripts[mode],
          formats: ["iife"],
          name: `PY_${mode}`,
          fileName: () => `${mode}.js`,
        },
      },
    };
  }

  // Default build: popup + background
  return {
    plugins: [react()],
    base: "./",
    define,
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: true,
      rollupOptions: {
        input: {
          popup: "src/popup.html",
          background: "src/background.ts",
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === "background" ? "background.js" : "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: (asset) =>
            asset.name === "popup.html" || asset.name === "popup.css"
              ? asset.name
              : "[name].[ext]",
        },
      },
    },
  };
});