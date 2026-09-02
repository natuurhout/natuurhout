import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, ".next", "server", "app");
const publicDir = path.join(root, "public");
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith(".html")) htmlFiles.push(fullPath);
  }
}

walk(outputDir);

const referenced = new Set();
const hotlinks = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/https:\/\/(?:www\.)?natuurhout\.be\/wp-content\/uploads\/[^\s"'<>)]+/gi)) {
    hotlinks.push(`${path.relative(outputDir, file)}: ${match[0]}`);
  }
  for (const match of html.matchAll(/\/wp-content\/uploads\/[^\s"'<>)]+/gi)) {
    referenced.add(match[0].split("?")[0]);
  }
}

const missing = [...referenced].filter((pathname) => {
  const target = path.join(publicDir, ...decodeURIComponent(pathname).split("/").filter(Boolean));
  return !fs.existsSync(target) || fs.statSync(target).size === 0;
});

console.log(`Built HTML files scanned: ${htmlFiles.length}`);
console.log(`Localized WordPress assets referenced: ${referenced.size}`);
console.log(`Missing local assets: ${missing.length}`);
console.log(`Remaining WordPress media hotlinks: ${hotlinks.length}`);

if (missing.length || hotlinks.length) {
  if (missing.length) console.error(`Missing:\n${missing.join("\n")}`);
  if (hotlinks.length) console.error(`Hotlinks:\n${hotlinks.slice(0, 25).join("\n")}`);
  process.exit(1);
}

console.log("Built asset ownership gate passed.");
