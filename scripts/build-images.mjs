// Post-build step (SEO batch 2, Nov 2026): the WebP copies that next/image asks
// for through src/lib/image-loader.ts, /_img/w<width>/<original path>.webp.
//
// Written for every such URL in the built pages and payloads (out/**/*.html,
// *.txt, *.js), plus every width of the own photos in public/fotos/ (client
// components such as the calculator pick those at runtime). Never larger than
// the original (no upscaling). A copy that is missing is answered by the Worker
// with the original file (worker/index.ts), so nothing breaks.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join } from "node:path";
import sharp from "sharp";

const OUT = "out";
const PUBLIC = "public";
const PREFIX = "/_img/w";
const QUALITY = 75;
// Copies by content hash, kept between builds (and between deploy runs:
// actions/cache in .github/workflows/deploy.yml), so a build only encodes new photos.
const CACHE = join(".cache", "images");
// next.config.ts images.deviceSizes + imageSizes
const WIDTHS = [64, 128, 256, 384, 640, 828, 1080, 1400, 1920];

function walk(dir, keep) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "_img" ? [] : walk(p, keep);
    return keep(entry.name) ? [p] : [];
  });
}

const wanted = new Map(); // "w|/path" -> { width, path }
const add = (width, path) => wanted.set(`${width}|${path}`, { width, path });
const pattern = /\/_img\/w(\d+)(\/[^"'\s\\<>?#,]+?\.(?:jpe?g|png|webp))\.webp/gi;

for (const file of walk(OUT, (name) => /\.(html|txt|js)$/.test(name))) {
  for (const match of readFileSync(file, "utf8").matchAll(pattern)) add(Number(match[1]), match[2]);
}
for (const file of walk(join(PUBLIC, "fotos"), (name) => /\.(jpe?g|png|webp)$/i.test(name))) {
  const path = `/${file.slice(PUBLIC.length + 1).split("\\").join("/")}`;
  for (const width of WIDTHS) add(width, encodeURI(path));
}

let written = 0;
let skipped = 0;
const missing = [];
const failed = [];
const jobs = [...wanted.values()];

const hashes = new Map();
const hashOf = (file) => {
  if (!hashes.has(file)) hashes.set(file, createHash("sha1").update(readFileSync(file)).digest("hex"));
  return hashes.get(file);
};
mkdirSync(CACHE, { recursive: true });

async function build({ width, path }) {
  const original = decodeURIComponent(path);
  const source = join(PUBLIC, ...original.split("/").filter(Boolean));
  const target = join(OUT, ...`${PREFIX}${width}${original}.webp`.split("/").filter(Boolean));
  if (!existsSync(source)) return void missing.push(original);
  mkdirSync(dirname(target), { recursive: true });
  const cached = join(CACHE, `${hashOf(source)}-w${width}-q${QUALITY}.webp`);
  if (existsSync(cached)) {
    copyFileSync(cached, target);
    return void skipped++;
  }
  try {
    await sharp(source, { failOn: "none" }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(cached);
    copyFileSync(cached, target);
    written++;
  } catch (error) {
    failed.push(`${original} (${error.message})`);
  }
}

const workers = Array.from({ length: Math.max(2, availableParallelism()) }, async () => {
  while (jobs.length) await build(jobs.pop());
});
await Promise.all(workers);

console.log(`build-images: ${wanted.size} WebP copies (${written} encoded, ${skipped} from the cache)`);
if (failed.length) console.warn(`build-images: ${failed.length} copy/copies failed, the Worker serves the original:\n  ${failed.slice(0, 20).join("\n  ")}`);
if (missing.length) console.warn(`build-images: no source for ${[...new Set(missing)].length} image(s), the Worker serves the original:\n  ${[...new Set(missing)].slice(0, 20).join("\n  ")}`);
