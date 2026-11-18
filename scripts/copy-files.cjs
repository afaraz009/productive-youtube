const fs = require("fs");
const path = require("path");

fs.copyFileSync("public/manifest.json", "dist/manifest.json");

fs.mkdirSync("dist/icons", { recursive: true });
for (const f of ["icon16.png", "icon48.png", "icon128.png"]) {
  const src = path.join("public", "icons", f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join("dist", "icons", f));
}

// Vite emits HTML under dist/src/ with "../" asset paths.
// Move each page to dist/ root and fix the paths.
for (const page of ["popup", "auth"]) {
  const from = path.join("dist", "src", `${page}.html`);
  if (!fs.existsSync(from)) {
    console.warn(`Missing ${from}`);
    continue;
  }
  let html = fs.readFileSync(from, "utf8");
  html = html.replace(/(src|href)="\.\.\//g, '$1="./');
  fs.writeFileSync(path.join("dist", `${page}.html`), html);
}

fs.rmSync(path.join("dist", "src"), { recursive: true, force: true });
console.log("Files copied successfully");