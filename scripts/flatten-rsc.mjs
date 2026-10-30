// Post-build step for the static export (Cloudflare static assets).
//
// Next 16 writes per-segment RSC payloads nested, e.g.
//   out/valuta/euro-til-nok/__next.valuta/$d$par/__PAGE__.txt
// but the client router requests them flattened with dots:
//   /valuta/euro-til-nok/__next.valuta.$d$par.__PAGE__.txt
// Next's own server maps between the two; a plain static host does not, so client-side
// navigation 404s and falls back to full page loads. Write a flattened copy of every nested file.
import { copyFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
let copied = 0;

function walkFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}

function visit(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const file of walkFiles(p)) {
        const flat = `${name}.${relative(p, file).split(sep).join(".")}`;
        copyFileSync(file, join(dir, flat));
        copied++;
        // Cloudflare normalises "$" in request paths to "%24" and then looks the asset up by that
        // literal string, so also store a copy whose filename contains "%24".
        if (flat.includes("$")) {
          copyFileSync(file, join(dir, flat.replaceAll("$", "%24")));
          copied++;
        }
      }
    } else {
      visit(p);
    }
  }
}

visit(OUT);
console.log(`flatten-rsc: wrote ${copied} flattened RSC segment files`);
