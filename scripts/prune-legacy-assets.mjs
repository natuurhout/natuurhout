import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const uploadsDir = path.join(root, "public", "wp-content", "uploads");
const pages = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "legacy-pages.json"), "utf8"));
const sources = [
  ...pages.map((page) => page.html),
  fs.readFileSync(path.join(root, "src", "components", "Navbar.tsx"), "utf8"),
];
const referenced = new Set();

for (const source of sources) {
  for (const match of source.matchAll(/\/wp-content\/uploads\/[^\s"'<>)]+/gi)) {
    referenced.add(decodeURIComponent(match[0].split("?")[0]).replaceAll("/", path.sep).toLowerCase());
  }
}

let removed = 0;
for (const file of fs.readdirSync(uploadsDir, { recursive: true, withFileTypes: true })) {
  if (!file.isFile()) continue;
  const fullPath = path.join(file.parentPath, file.name);
  const publicPath = fullPath.slice(path.join(root, "public").length).toLowerCase();
  if (!referenced.has(publicPath)) {
    fs.unlinkSync(fullPath);
    removed += 1;
  }
}

console.log(`Removed ${removed} unreferenced mirrored assets; ${referenced.size} remain referenced.`);
