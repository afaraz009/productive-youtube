import { defineConfig } from "vite";

// Builds ONLY the content script, as one self-contained file (dist/content_script.js).
//
// Why a separate build: Chrome runs content scripts as plain scripts, which can't use
// `import`. In the main build (vite.config.ts), code shared with the popup (e.g.
// highlightStorage.ts) gets split into its own file and the content script would
// start with `import ... from "./highlightStorage.js"` → it crashes on every page.
// Built alone, everything it needs is bundled inside it.
export default defineConfig({
  publicDir: false, // the main build / copy-files already copy public/
  build: {
    outDir: "dist",
    emptyOutDir: false, // don't delete what the main build wrote
    rollupOptions: {
      input: "src/scripts/content.ts",
      output: {
        format: "iife", // a plain script: no import/export
        entryFileNames: "content_script.js",
      },
    },
    sourcemap: false,
    minify: true,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
