/*
 * Tiny server-side HTML for the admin: `html` escapes every interpolated
 * value unless it is itself `html` (Safe), so customer input can never
 * inject markup. Arrays are joined; null/undefined/false render nothing.
 */

export class Safe {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

type Part = Safe | string | number | null | undefined | false | Part[];

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(part: Part): string {
  if (part === null || part === undefined || part === false) return "";
  if (Array.isArray(part)) return part.map(render).join("");
  if (part instanceof Safe) return part.value;
  return esc(String(part));
}

export function html(strings: TemplateStringsArray, ...values: Part[]): Safe {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return new Safe(out);
}

export const raw = (value: string) => new Safe(value);

const dateFmt = new Intl.DateTimeFormat("nl-BE", {
  timeZone: "Europe/Brussels",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export const when = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "");

export const euro = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : `€ ${n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** Multi-line customer text, escaped, with line breaks kept. */
export const lines = (text: string) => raw(esc(text).replace(/\r?\n/g, "<br>"));

const CSS = `
:root{--bg:#f6f4ef;--card:#fff;--ink:#1f2a1f;--soft:#5d665b;--line:#e3dfd5;--accent:#4b6b2f;--accent-ink:#fff;--warn:#a5521b;--chip:#efece4;
--s-nieuw:#c2410c;--s-bezig:#1d4ed8;--s-offerte:#7c3aed;--s-gewonnen:#15803d;--s-verloren:#6b7280}
@media (prefers-color-scheme:dark){:root{--bg:#141712;--card:#1d211b;--ink:#e8ebe4;--soft:#a3ab9f;--line:#2f352c;--accent:#8fb465;--accent-ink:#141712;--warn:#f0a36b;--chip:#262b23;
--s-nieuw:#fb923c;--s-bezig:#60a5fa;--s-offerte:#c4b5fd;--s-gewonnen:#4ade80;--s-verloren:#9ca3af}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--accent)}header{background:var(--card);border-bottom:1px solid var(--line)}
.bar{max-width:1100px;margin:0 auto;padding:10px 16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.brand{font-weight:700;color:var(--ink);text-decoration:none}nav{display:flex;gap:4px;flex-wrap:wrap;flex:1}
nav a{padding:6px 10px;border-radius:8px;text-decoration:none;color:var(--soft)}nav a.on{background:var(--chip);color:var(--ink);font-weight:600}
.me{color:var(--soft);font-size:13px}main{max-width:1100px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:22px;margin:4px 0 16px}h2{font-size:16px;margin:0 0 10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
.grid{display:grid;gap:16px}.grid>*{min-width:0}.side-first{order:-1}@media(min-width:860px){.grid.two{grid-template-columns:2fr 1fr}.side-first{order:0}}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-decoration:none;color:var(--ink)}
.stat b{display:block;font-size:26px}.stat span{color:var(--soft);font-size:13px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--soft);font-weight:600}
.scroll{overflow-x:auto}td.num,th.num{text-align:right;white-space:nowrap}
.chip{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;background:var(--chip);white-space:nowrap}
.st-nieuw{color:var(--s-nieuw)}.st-in_behandeling{color:var(--s-bezig)}.st-offerte_verstuurd{color:var(--s-offerte)}
.st-gewonnen{color:var(--s-gewonnen)}.st-verloren,.st-gearchiveerd{color:var(--s-verloren)}
.muted{color:var(--soft)}.small{font-size:13px}.warn{color:var(--warn)}
form.inline{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
label{display:block;font-size:13px;color:var(--soft);margin-bottom:10px}
input,select,textarea{display:block;width:100%;margin-top:3px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
form.inline label{margin:0}form.inline input,form.inline select{width:auto;min-width:160px}
textarea{min-height:90px;resize:vertical}
button,.btn{display:inline-block;padding:8px 14px;border:0;border-radius:8px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:600;cursor:pointer;text-decoration:none}
.btn.ghost{background:var(--chip);color:var(--ink)}
.fields{display:grid;gap:0 12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.timeline{list-style:none;margin:0;padding:0}.timeline li{padding:10px 0;border-bottom:1px solid var(--line)}
.timeline li.event{color:var(--soft);font-size:13px}.timeline .meta{font-size:12px;color:var(--soft)}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0}dt{color:var(--soft)}dd{margin:0}
.flash{background:var(--chip);border-left:4px solid var(--accent);padding:10px 14px;border-radius:8px;margin-bottom:16px}
.head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.head h1{margin:0}
pre.body{white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;background:var(--bg);padding:12px;border-radius:8px;margin:0;max-height:420px;overflow:auto}
`;

export type Section = "overzicht" | "aanvragen" | "klanten" | "instellingen";

export function page(opts: {
  title: string;
  base: string;
  section?: Section;
  user?: { email: string; name: string };
  flash?: string;
  body: Safe;
}): string {
  const { base, section } = opts;
  const tab = (key: Section, href: string, label: string) =>
    html`<a href="${base}${href}" class="${section === key ? "on" : ""}">${label}</a>`;
  return `<!doctype html>${html`<html lang="nl-BE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${opts.title} · Natuurhout beheer</title>
<style>${raw(CSS)}</style></head><body>
<header><div class="bar"><a class="brand" href="${base}/">Natuurhout beheer</a>
${opts.user ? html`<nav>${tab("overzicht", "/", "Overzicht")}${tab("aanvragen", "/aanvragen", "Aanvragen")}${tab("klanten", "/klanten", "Klanten")}${tab("instellingen", "/instellingen", "Instellingen")}</nav>
<span class="me">${opts.user.name || opts.user.email} · <a href="/cdn-cgi/access/logout">Afmelden</a></span>` : ""}
</div></header>
<main>${opts.flash ? html`<div class="flash">${opts.flash}</div>` : ""}${opts.body}</main>
</body></html>`}`;
}
