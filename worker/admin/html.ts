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

/** Whole euros for the board: "€ 12.260". */
const euroWhole = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const euroRound = (n: number | null | undefined) => (n === null || n === undefined ? "" : euroWhole.format(n));

/** "net nu", "5 min", "3 uur", "4 dagen", "2 weken", "3 maanden", "1 jaar". */
export function ago(iso: string | null | undefined): string {
  if (!iso) return "";
  const min = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60_000);
  const unit = (n: number, one: string, many: string) => `${Math.floor(n)} ${Math.floor(n) === 1 ? one : many}`;
  if (min < 1) return "net nu";
  if (min < 60) return `${Math.floor(min)} min`;
  if (min < 60 * 24) return unit(min / 60, "uur", "uur");
  const days = min / 60 / 24;
  if (days < 14) return unit(days, "dag", "dagen");
  if (days < 60) return unit(days / 7, "week", "weken");
  if (days < 365) return unit(days / 30.4, "maand", "maanden");
  return unit(days / 365, "jaar", "jaar");
}

/** "Xander Dijkstra" → "XD", "info@x.be" → "I". */
export const initials = (name: string) =>
  name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// Lucide icons (ISC license), inline so the admin needs no extra requests.
const ICONS = {
  home: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  check: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  settings: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  board: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  tree: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  boxes: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
} as const;
export type IconName = keyof typeof ICONS;
export const icon = (name: IconName) =>
  raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`);

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888c90' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

// Natuurhout house style (tailwind.config.ts): charcoal + orange, cool greys.
const CSS = `
:root{color-scheme:light;--bg:#f5f5f3;--card:#fff;--lane:#ebebe8;--ink:#25292c;--soft:#6b7076;--line:#e1e2df;--line-strong:#cfd1cd;--chip:#f0f0ed;
--accent:#d77d1f;--accent-deep:#b05e10;--accent-soft:#fbeedd;--link:#b05e10;--focus:#d77d1f40;
--side:#2a2b2a;--side-ink:#e6e7e4;--side-soft:#9a9d99;--side-hover:#ffffff10;--side-on:#ffffff1c;
--warn:#b45309;--warn-bg:#fdf0dc;
--s-nieuw:#2563eb;--s-in_behandeling:#7c3aed;--s-offerte_verstuurd:#d97706;--s-gewonnen:#16a34a;--s-verloren:#dc2626;--s-gearchiveerd:#8a8f94;
--src-vraag-bg:#fdf1d8;--src-vraag:#8a4b0b;--src-best-bg:#e2f3e7;--src-best:#166534;
--shadow:0 1px 2px #1a1d1f0d,0 1px 3px #1a1d1f08;--shadow-lg:0 6px 20px #1a1d1f1f}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#121413;--card:#1b1e1d;--lane:#171a19;--ink:#e7e9e6;--soft:#9ca19d;--line:#2a2e2c;--line-strong:#3a3f3c;--chip:#242826;
--accent-soft:#3a2915;--link:#f2a03d;--side:#0d0f0e;--warn:#f5a54a;--warn-bg:#3a2915;
--s-nieuw:#60a5fa;--s-in_behandeling:#a78bfa;--s-offerte_verstuurd:#fbbf24;--s-gewonnen:#4ade80;--s-verloren:#f87171;--s-gearchiveerd:#9ca3af;
--src-vraag-bg:#3a2e14;--src-vraag:#fcd58a;--src-best-bg:#163222;--src-best:#86efac;--shadow:0 1px 2px #0006;--shadow-lg:0 6px 20px #0008}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 Figtree,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--link);text-underline-offset:2px}svg{display:block}
.layout{display:flex;min-height:100vh}

aside{width:244px;flex:none;background:var(--side);color:var(--side-ink);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:14px 10px 12px;overflow-y:auto}
.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:4px 8px 14px;letter-spacing:-.01em;line-height:1.25}
.brand small{display:block;font-weight:500;font-size:11.5px;color:var(--side-soft);letter-spacing:0}
.logo{width:32px;height:32px;border-radius:9px;background:var(--accent);color:#fff;display:grid;place-items:center;flex:none}.logo svg{width:18px;height:18px}
aside nav{display:flex;flex-direction:column;gap:1px;flex:1}
aside .group{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--side-soft);padding:16px 12px 6px}
aside nav a{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:9px;color:var(--side-ink);text-decoration:none;font-size:14px}
aside nav a svg{width:17px;height:17px;flex:none;opacity:.75}
aside nav a .l{flex:1}
aside nav a:hover{background:var(--side-hover)}
aside nav a.on{background:var(--side-on);color:#fff;font-weight:600}aside nav a.on svg{opacity:1;color:#f2a03d}
aside nav a.sub{padding:5px 10px 5px 37px;font-size:13px;color:var(--side-soft)}aside nav a.sub.on{color:#fff}
.badge{font-size:11px;font-weight:700;min-width:20px;text-align:center;padding:1px 7px;border-radius:999px;background:var(--accent-deep);color:#fff}
.badge.warn{background:#c62828}
.me{display:flex;align-items:center;gap:10px;border-top:1px solid #ffffff17;margin-top:12px;padding:12px 6px 0;font-size:13px}
.me .who{flex:1;min-width:0;line-height:1.3}.me .who b,.me .who span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.me .who span{color:var(--side-soft);font-size:12px}
.me a{color:var(--side-soft);padding:6px;border-radius:8px}.me a:hover{color:#fff;background:var(--side-hover)}.me a svg{width:17px;height:17px}
.avatar{width:30px;height:30px;border-radius:50%;background:var(--accent-deep);color:#fff;display:inline-grid;place-items:center;font-weight:700;font-size:12px;flex:none;letter-spacing:.02em}
.avatar.sm{width:22px;height:22px;font-size:9.5px;background:var(--chip);color:var(--soft);border:1px solid var(--line)}

.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{height:56px;flex:none;display:flex;align-items:center;gap:10px;padding:0 28px;border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:4}
.crumbs{flex:1;font-size:14px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crumbs b{color:var(--ink);font-weight:600}
main{width:100%;max-width:1200px;margin:0 auto;padding:26px 28px 72px}main.wide{max-width:none}
h1{font-size:25px;line-height:1.2;margin:0 0 18px;letter-spacing:-.015em;font-weight:700}h2{font-size:15px;margin:0 0 12px;font-weight:650}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 16px;flex-wrap:wrap;margin-bottom:20px}.head h1{margin:0}
.head .sub{margin:3px 0 0;color:var(--soft)}.head h2{margin:0}
.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-bottom:16px;box-shadow:var(--shadow)}
.grid{display:grid;gap:16px}.grid>*{min-width:0}.side-first{order:-1}@media(min-width:900px){.grid.two{grid-template-columns:minmax(0,2fr) minmax(280px,1fr)}.side-first{order:0}}
.muted{color:var(--soft)}.small{font-size:13px}.warn{color:var(--warn)}

.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin-bottom:20px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;text-decoration:none;color:var(--ink);box-shadow:var(--shadow);transition:border-color .15s,box-shadow .15s}
.stat:hover{border-color:var(--line-strong);box-shadow:var(--shadow-lg)}
.stat span{display:flex;align-items:center;gap:7px;color:var(--soft);font-size:13px}
.stat b{display:block;font-size:28px;line-height:1.15;margin-top:6px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.stat b.warn{color:var(--warn)}
.st-nieuw{--c:var(--s-nieuw)}.st-in_behandeling{--c:var(--s-in_behandeling)}.st-offerte_verstuurd{--c:var(--s-offerte_verstuurd)}
.st-gewonnen{--c:var(--s-gewonnen)}.st-verloren{--c:var(--s-verloren)}.st-gearchiveerd{--c:var(--s-gearchiveerd)}.st-offerte{--c:var(--s-in_behandeling)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--c,currentColor);display:inline-block;flex:none}

.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:middle}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--soft);font-weight:600;padding-top:4px}
tbody tr:last-child td{border-bottom:0}tbody tr:hover td{background:var(--bg)}
td a{color:var(--ink);font-weight:600;text-decoration:none}td a:hover{color:var(--link);text-decoration:underline}
td.num,th.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.prices td{padding:5px 8px}

.chip{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:var(--chip);color:var(--ink);white-space:nowrap;vertical-align:middle}
.chip[class*=" st-"]::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.chip.warn{background:var(--warn-bg);color:var(--warn)}
.src{font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;white-space:nowrap;flex:none;background:var(--accent-soft);color:var(--link);line-height:1.5}
.src.vraag{background:var(--src-vraag-bg);color:var(--src-vraag)}.src.bestelling{background:var(--src-best-bg);color:var(--src-best)}.src.manueel{background:var(--chip);color:var(--soft)}

label{display:block;font-size:13px;font-weight:500;color:var(--soft);margin-bottom:12px}
input,select,textarea{display:block;width:100%;margin-top:5px;height:38px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:inherit;font-size:14px;transition:border-color .15s,box-shadow .15s}
select{appearance:none;-webkit-appearance:none;background-image:${CHEVRON};background-repeat:no-repeat;background-position:right 10px center;padding-right:34px;cursor:pointer}
textarea{height:auto;min-height:96px;padding:10px 12px;resize:vertical}
input::placeholder,textarea::placeholder{color:var(--soft);opacity:.55}
input:hover,select:hover,textarea:hover{border-color:var(--line-strong)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--focus)}
.fields{display:grid;gap:0 14px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
form.inline{display:flex;gap:10px;flex-wrap:wrap;align-items:end}form.inline label{margin:0}form.inline input,form.inline select{width:auto;min-width:160px}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 16px;border:1px solid transparent;border-radius:10px;background:var(--accent-deep);color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;transition:filter .15s,background .15s}
button:hover,.btn:hover{filter:brightness(1.08)}
button:focus-visible,.btn:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.btn svg,button svg{width:16px;height:16px}
.btn.ghost{background:var(--card);color:var(--ink);border-color:var(--line);box-shadow:var(--shadow)}.btn.ghost:hover{background:var(--chip);filter:none}
.btn.sm{height:32px;padding:0 12px;font-size:13px}
button.tick{width:22px;height:22px;padding:0;border-radius:7px;border:2px solid var(--line-strong);background:transparent;color:var(--accent-deep);font-size:13px;line-height:1;margin-top:1px}
button.tick:hover{border-color:var(--accent);filter:none}button.tick.on{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}

.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.toolbar label{margin:0}
.toolbar .search{position:relative;flex:1 1 260px;margin:0}
.toolbar .search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--soft);pointer-events:none}
.toolbar .search input{margin:0;padding-left:37px}
.toolbar select{margin:0;width:auto;min-width:140px}
.summary{color:var(--soft);font-size:13px;white-space:nowrap}.summary b{color:var(--ink)}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--card);box-shadow:var(--shadow)}
.seg a{display:inline-flex;align-items:center;gap:6px;padding:0 12px;height:36px;color:var(--soft);text-decoration:none;font-size:13px;font-weight:600}
.seg a+a{border-left:1px solid var(--line)}.seg a.on{background:var(--chip);color:var(--ink)}.seg svg{width:15px;height:15px}

.board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(236px,1fr);gap:14px;overflow-x:auto;padding-bottom:14px;align-items:start;scroll-snap-type:x proximity}
.col{display:flex;flex-direction:column;min-width:0;scroll-snap-align:start}
.col-head{display:flex;align-items:center;gap:8px;padding:0 4px 10px;font-size:14px;min-height:36px}
.col-head b{font-weight:650}.col-head .n{color:var(--soft);font-size:13px;font-variant-numeric:tabular-nums}
.col-head .sum{margin-left:auto;font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums}
.col-head .add{width:26px;height:26px;border:1px solid var(--line);border-radius:8px;display:grid;place-items:center;color:var(--soft);background:var(--card);flex:none}
.col-head .add:hover{color:var(--ink);border-color:var(--line-strong)}.col-head .add svg{width:14px;height:14px}
.col-body{display:flex;flex-direction:column;gap:10px;min-height:140px;padding:8px;border-radius:14px;background:var(--lane);transition:background .15s,box-shadow .15s}
.col-body.over{background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--accent)}
.empty{display:grid;place-items:center;min-height:110px;color:var(--soft);font-size:13px}
.k{position:relative;display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 13px;color:var(--ink);text-decoration:none;box-shadow:var(--shadow);transition:box-shadow .15s,border-color .15s}
.k:hover{border-color:var(--line-strong);box-shadow:var(--shadow-lg)}.k[draggable=true]{cursor:grab}.k.dragging{opacity:.45}
.k-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.k-name{font-weight:600;font-size:14.5px;line-height:1.3;overflow-wrap:anywhere}
.k-sub{color:var(--soft);font-size:12.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.k-title{font-size:13px;margin-top:7px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.k-foot{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:var(--soft)}
.k-foot .amt{margin-left:auto;color:var(--ink);font-weight:650;font-size:12.5px;font-variant-numeric:tabular-nums}
.k-flag{color:var(--warn);font-weight:600}
.k .ping{position:absolute;top:-4px;right:-4px;width:11px;height:11px;border-radius:50%;background:var(--s-nieuw);border:2px solid var(--bg)}
.more{display:block;text-align:center;font-size:13px;padding:4px;color:var(--soft)}

.timeline{list-style:none;margin:0;padding:0}.timeline li{padding:11px 0;border-bottom:1px solid var(--line)}.timeline li:last-child{border-bottom:0}
.timeline li.event{color:var(--soft);font-size:13px}.timeline .meta{font-size:12px;color:var(--soft);margin-bottom:2px}
.timeline li.task{display:flex;gap:10px;align-items:flex-start}form.check{margin:0}
dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}dt{color:var(--soft)}dd{margin:0;overflow-wrap:anywhere}
.flash{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--s-gewonnen);box-shadow:var(--shadow);padding:10px 14px;border-radius:10px;margin-bottom:18px;font-weight:500}
pre.body{white-space:pre-wrap;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;background:var(--bg);border:1px solid var(--line);padding:12px 14px;border-radius:10px;margin:0;max-height:420px;overflow:auto}
.tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin-bottom:14px;border-bottom:1px solid var(--line)}
.tabs a{padding:8px 12px;color:var(--soft);text-decoration:none;font-weight:600;font-size:13.5px;border-bottom:2px solid transparent;white-space:nowrap;margin-bottom:-1px}
.tabs a.on{color:var(--ink);border-color:var(--accent)}.tabs a:hover{color:var(--ink)}.tabs .n{font-weight:500;color:var(--soft);font-size:12px}
.os-nieuw{--c:var(--s-nieuw)}.os-bevestigd{--c:var(--s-offerte_verstuurd)}.os-betaald{--c:var(--s-gewonnen)}.os-klaar{--c:var(--s-in_behandeling)}.os-geleverd{--c:var(--s-gearchiveerd)}.os-geannuleerd{--c:var(--s-verloren)}
.chip[class*=" os-"]::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.steps{display:flex;flex-direction:column;gap:14px}.steps form.act{padding-bottom:14px;border-bottom:1px solid var(--line)}.steps form.act:last-child{border-bottom:0;padding-bottom:0}
.steps form.act button{width:100%}
label.check{display:flex;gap:8px;align-items:center;color:var(--ink);font-weight:500}label.check input{width:auto;height:auto;margin:0}
table.editor td{padding:6px 6px}table.editor input,table.editor select{margin:0}
form.inline-form{display:inline;margin:0}
code{font:13px ui-monospace,Menlo,Consolas,monospace;background:var(--chip);padding:2px 6px;border-radius:6px}
details summary{cursor:pointer;color:var(--link);font-weight:500}
.bars{display:flex;align-items:flex-end;gap:6px;height:180px;padding-top:10px}
.bars .bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;height:100%;justify-content:flex-end}
.bars .bar i{display:block;width:100%;max-width:42px;background:var(--accent);border-radius:6px 6px 2px 2px;min-height:2px}
.bars .bar span{font-size:11px;color:var(--soft);white-space:nowrap}.bars .bar b{font-size:10.5px;font-weight:600;white-space:nowrap}
.meter{height:8px;border-radius:99px;background:var(--chip);overflow:hidden}.meter i{display:block;height:100%;background:var(--accent)}
.k-low{color:var(--danger,#c62828);font-weight:700}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:10px;font-weight:500;box-shadow:var(--shadow-lg);z-index:20}

@media(max-width:899px){
.layout{display:block}
aside{position:sticky;top:0;z-index:6;width:auto;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;padding:8px 12px 6px;gap:4px 8px;overflow:visible}
.brand{padding:2px 4px;flex:1}.brand small{display:none}.logo{width:28px;height:28px}
aside nav{order:3;flex-basis:100%;flex-direction:row;overflow-x:auto;scrollbar-width:none;margin:0 -12px;padding:2px 8px;gap:2px}aside nav::-webkit-scrollbar{display:none}
aside .group,.me .who{display:none}aside nav a{white-space:nowrap;padding:7px 10px}aside nav a.sub{padding:7px 10px}
.me{border:0;margin:0;padding:0}.topbar{display:none}
main{padding:18px 14px 72px}h1{font-size:22px}
input,select,textarea{font-size:16px}
.toolbar select{flex:1 1 140px}
.board{grid-auto-columns:84%;margin:0 -14px;padding:0 14px 14px;scroll-padding:0 14px}
}
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
  | "instellingen"
  | "facturen"
  | "voorraad"
  | "rapporten";

const CRUMBS: Record<Section, [string, string]> = {
  overzicht: ["", "Overzicht"],
  aanvragen: ["Verkoop", "Aanvragen"],
  offertes: ["Verkoop", "Offertes"],
  bestellingen: ["Webshop", "Bestellingen"],
  facturen: ["Webshop", "Facturen"],
  producten: ["Webshop", "Producten"],
  voorraad: ["Webshop", "Voorraad"],
  rapporten: ["Webshop", "Rapporten"],
  taken: ["Verkoop", "Taken"],
  klanten: ["Gegevens", "Klanten"],
  activiteit: ["Gegevens", "Activiteit"],
  instellingen: ["", "Instellingen"],
};

/** Counters in the sidebar. */
export type Badges = { nieuw: number; taken: number; takenLaat: number; orders: number; lowStock: number };

export function page(opts: {
  title: string;
  base: string;
  section?: Section;
  user?: { email: string; name: string };
  badges?: Badges;
  flash?: string;
  /** Full width (the pipeline board). */
  wide?: boolean;
  body: Safe;
}): string {
  const { base, section, badges } = opts;
  const badge = (n: number | undefined, warn = false) => (n ? html`<span class="badge${warn ? " warn" : ""}">${n}</span>` : "");
  const tab = (key: Section, href: string, label: string, ico: IconName | null, extra: Safe | string = "") =>
    html`<a href="${base}${href}" class="${[!ico && "sub", section === key && "on"].filter(Boolean).join(" ")}"${
      section === key ? raw(' aria-current="page"') : ""
    }>${ico ? icon(ico) : ""}<span class="l">${label}</span>${extra}</a>`;
  const crumb = section ? CRUMBS[section] : null;
  const nav = opts.user
    ? html`<nav aria-label="Beheer">
${tab("overzicht", "/", "Overzicht", "home")}
<span class="group">Verkoop</span>
${tab("aanvragen", "/aanvragen", "Aanvragen", "inbox", badge(badges?.nieuw))}
${tab("offertes", "/aanvragen?soort=offertes", "Offertes", null)}
${tab("taken", "/taken", "Taken", "check", badge(badges?.takenLaat || badges?.taken, Boolean(badges?.takenLaat)))}
<span class="group">Webshop</span>
${tab("bestellingen", "/bestellingen", "Bestellingen", "cart", badge(badges?.orders))}
${tab("facturen", "/facturen", "Facturen", "receipt")}
${tab("producten", "/producten", "Producten", "package")}
${tab("voorraad", "/voorraad", "Voorraad", "boxes", badge(badges?.lowStock, true))}
${tab("rapporten", "/rapporten", "Rapporten", "chart")}
<span class="group">Gegevens</span>
${tab("klanten", "/klanten", "Klanten", "users")}
${tab("activiteit", "/activiteit", "Activiteit", "activity")}
${tab("instellingen", "/instellingen", "Instellingen", "settings")}
</nav>
<div class="me"><span class="avatar">${initials(opts.user.name || opts.user.email)}</span><span class="who"><b>${opts.user.name || opts.user.email}</b><span>${
        opts.user.email
      }</span></span><a href="/cdn-cgi/access/logout" title="Afmelden" aria-label="Afmelden">${icon("logout")}</a></div>`
    : "";
  const topbar = opts.user
    ? html`<div class="topbar"><div class="crumbs">${crumb?.[0] ? html`${crumb[0]} / ` : ""}<b>${crumb?.[1] ?? opts.title}</b></div>
<a class="btn ghost sm" href="https://www.natuurhout.be/" target="_blank" rel="noopener">${icon("external")}Website</a>
<a class="btn sm" href="${base}/aanvragen/nieuw">${icon("plus")}Nieuwe aanvraag</a></div>`
    : "";
  return `<!doctype html>${html`<html lang="nl-BE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#2a2b2a">
<title>${opts.title} · Natuurhout beheer</title>
<style>${raw(CSS)}</style>
<script src="${base}/app.js" defer></script></head><body>
<div class="layout"><aside><a class="brand" href="${base}/"><span class="logo">${icon("tree")}</span><span>Natuurhout<small>Beheer</small></span></a>${nav}</aside>
<div class="main">${topbar}<main${opts.wide ? raw(' class="wide"') : ""}>${opts.flash ? html`<div class="flash" role="status">${opts.flash}</div>` : ""}${opts.body}</main></div></div>
</body></html>`}`;
}

