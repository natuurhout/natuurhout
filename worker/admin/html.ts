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
a{color:var(--accent)}
.layout{display:flex;min-height:100vh}
aside{width:232px;flex:none;background:var(--card);border-right:1px solid var(--line);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:16px 12px;overflow-y:auto}
.brand{font-weight:700;color:var(--ink);text-decoration:none;padding:4px 10px 14px;display:block;font-size:16px}
aside nav{display:flex;flex-direction:column;gap:2px;flex:1}
aside nav .group{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--soft);padding:14px 10px 4px}
aside nav a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;text-decoration:none;color:var(--ink)}
aside nav a:hover{background:var(--chip)}aside nav a.on{background:var(--chip);font-weight:600}
aside nav a.sub{padding-left:22px;font-size:14px;color:var(--soft)}aside nav a.sub.on{color:var(--ink)}
.badge{font-size:11px;font-weight:700;min-width:20px;text-align:center;padding:1px 6px;border-radius:999px;background:var(--accent);color:var(--accent-ink)}
.badge.warn{background:var(--warn);color:var(--bg)}
.me{border-top:1px solid var(--line);padding:12px 10px 0;font-size:13px;color:var(--soft)}
.main{flex:1;min-width:0}main{max-width:1100px;margin:0 auto;padding:24px 20px 60px}
@media(max-width:859px){.layout{display:block}
aside{width:auto;height:auto;position:sticky;top:0;z-index:5;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:8px 12px 6px;border-right:0;border-bottom:1px solid var(--line);overflow:visible}
.brand{padding:4px 6px;font-size:15px;white-space:nowrap;flex:1}
aside nav{order:3;flex-basis:100%;flex-direction:row;overflow-x:auto;white-space:nowrap;scrollbar-width:none;margin:0 -12px;padding:0 6px}aside nav::-webkit-scrollbar{display:none}
aside nav .group,.me .who{display:none}aside nav a.sub{padding-left:10px}
.me{border:0;padding:0;white-space:nowrap}main{padding:16px 16px 60px}}
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
.chip.warn{color:var(--warn)}
.timeline li.task{display:flex;gap:10px;align-items:flex-start}form.check{margin:0}
button.tick{width:22px;height:22px;padding:0;border-radius:6px;border:2px solid var(--line);background:transparent;color:var(--accent);font-size:13px;line-height:1;margin-top:1px}
button.tick:hover{border-color:var(--accent)}button.tick.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.prices td{padding:4px 6px}.flash{background:var(--chip);border-left:4px solid var(--accent);padding:10px 14px;border-radius:8px;margin-bottom:16px}
.head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.head h1{margin:0}
pre.body{white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;background:var(--bg);padding:12px;border-radius:8px;margin:0;max-height:420px;overflow:auto}
`;

export type Section =
  | "overzicht"
  | "aanvragen"
  | "offertes"
  | "bestellingen"
  | "taken"
  | "klanten"
  | "producten"
  | "activiteit"
  | "instellingen";

/** Counters in the sidebar. */
export type Badges = { nieuw: number; taken: number; takenLaat: number };

export function page(opts: {
  title: string;
  base: string;
  section?: Section;
  user?: { email: string; name: string };
  badges?: Badges;
  flash?: string;
  body: Safe;
}): string {
  const { base, section, badges } = opts;
  const badge = (n: number | undefined, warn = false) => (n ? html`<span class="badge${warn ? " warn" : ""}">${n}</span>` : "");
  const tab = (key: Section, href: string, label: string, extra: Safe | string = "", sub = false) =>
    html`<a href="${base}${href}" class="${[sub && "sub", section === key && "on"].filter(Boolean).join(" ")}"><span>${label}</span>${extra}</a>`;
  const nav = opts.user
    ? html`<nav>
${tab("overzicht", "/", "Overzicht")}
<span class="group">Verkoop</span>
${tab("aanvragen", "/aanvragen", "Aanvragen", badge(badges?.nieuw))}
${tab("offertes", "/aanvragen?soort=offertes", "Offertes", "", true)}
${tab("bestellingen", "/aanvragen?soort=bestellingen", "Bestellingen", "", true)}
${tab("taken", "/taken", "Taken", badge(badges?.takenLaat || badges?.taken, Boolean(badges?.takenLaat)))}
<span class="group">Gegevens</span>
${tab("klanten", "/klanten", "Klanten")}
${tab("producten", "/producten", "Producten")}
${tab("activiteit", "/activiteit", "Activiteit")}
${tab("instellingen", "/instellingen", "Instellingen")}
</nav>
<div class="me"><span class="who">${opts.user.name || opts.user.email} · </span><a href="/cdn-cgi/access/logout">Afmelden</a></div>`
    : "";
  return `<!doctype html>${html`<html lang="nl-BE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${opts.title} · Natuurhout beheer</title>
<style>${raw(CSS)}</style></head><body>
<div class="layout"><aside><a class="brand" href="${base}/">Natuurhout beheer</a>${nav}</aside>
<div class="main"><main>${opts.flash ? html`<div class="flash">${opts.flash}</div>` : ""}${opts.body}</main></div></div>
</body></html>`}`;
}
