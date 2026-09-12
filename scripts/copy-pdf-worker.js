// pdfjs-dist ships its worker as an ESM (.mjs) file. Letting webpack bundle
// it via `new URL(..., import.meta.url)` sends it through Terser, which
// chokes on top-level import/export syntax in a non-module chunk. Serving it
// as a plain static file from /public sidesteps webpack entirely.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = path.join(__dirname, "..", "public");
const dest = path.join(destDir, "pdf.worker.min.mjs");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied pdf.worker.min.mjs to public/");
