import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const pages = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "legacy-pages.json"), "utf8"));
const sourceFiles = [
  ...pages.map((page) => page.html),
  fs.readFileSync(path.join(root, "src", "components", "Navbar.tsx"), "utf8"),
];

const assetPattern = /(?:https:\/\/(?:www\.)?natuurhout\.be)?(\/wp-content\/uploads\/[^\s"'<>)]+?)(?=[?"'<>)\s]|$)/gi;
const assets = new Set();

for (const source of sourceFiles) {
  for (const match of source.matchAll(assetPattern)) {
    const pathname = match[1].replace(/&amp;.*$/, "");
    assets.add(pathname);
  }
}

function targetFor(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = path.resolve(publicDir, `.${decoded}`);
  if (!target.startsWith(path.resolve(publicDir, "wp-content", "uploads") + path.sep)) {
    throw new Error(`Unsafe asset path: ${pathname}`);
  }
  return target;
}

async function download(pathname) {
  const target = targetFor(pathname);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) return "cached";

  const url = new URL(pathname, "https://www.natuurhout.be");
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, { headers: { "user-agent": "Natuurhout migration asset mirror" } });
    if (response.ok) break;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  if (!response?.ok) throw new Error(`${response?.status ?? "network error"} ${url}`);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/") && contentType !== "application/pdf") {
    throw new Error(`Unexpected content type ${contentType || "unknown"} for ${url}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  return "downloaded";
}

const queue = [...assets].sort();
let cursor = 0;
let downloaded = 0;
let cached = 0;
const failures = [];

async function worker() {
  while (cursor < queue.length) {
    const pathname = queue[cursor++];
    try {
      const status = await download(pathname);
      if (status === "downloaded") downloaded += 1;
      else cached += 1;
      if ((downloaded + cached) % 50 === 0) console.log(`Assets processed: ${downloaded + cached}/${queue.length}`);
    } catch (error) {
      failures.push(`${pathname}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, () => worker()));

console.log(`Legacy assets discovered: ${queue.length}`);
console.log(`Downloaded: ${downloaded}; already present: ${cached}; failed: ${failures.length}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
