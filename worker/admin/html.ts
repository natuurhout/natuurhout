/*
 * Tiny server-side HTML for the admin: `html` escapes every interpolated
 * value unless it is itself `html` (Safe), so customer input can never
 * inject markup. Arrays are joined; null/undefined/false render nothing.
 */

import { ADMIN_FAVICON } from "./favicon";

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
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  note: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
} as const;
export type IconName = keyof typeof ICONS;
export const icon = (name: IconName) =>
  raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`);

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888c90' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

// Look and feel after Shopify's admin (Polaris): grey sidebar with search, a
// light rounded surface, white cards, compact tables, black primary buttons,
// pill badges with a progress dot. Natuurhout orange only for the logo tile.
const CSS = `
:root{color-scheme:light;--frame:#ebebeb;--bg:#f1f1f1;--card:#fff;--ink:#303030;--soft:#616161;--faint:#8a8a8a;--line:#e3e3e3;--line-strong:#cccccc;--hover:#f7f7f7;--th:#f7f7f7;--chip:#0000000f;
--accent:#d77d1f;--accent-deep:#b05e10;--accent-soft:#fbeedd;--link:#005bd3;--focus:#005bd3;
--side-ink:#303030;--side-soft:#616161;--side-hover:#0000000d;--side-on:#fafafa;
--warn:#8a6116;--warn-bg:#ffeb78;--warn-ink:#4f4700;--info-bg:#e0f0ff;--info-ink:#00527c;--ok-bg:#cdfee1;--ok-ink:#0c5132;--bad-bg:#fedad9;--bad-ink:#8e0b21;--orange-bg:#ffd6a4;--orange-ink:#5e4200;
--s-nieuw:#005bd3;--s-in_behandeling:#8051ff;--s-offerte_verstuurd:#b98900;--s-gewonnen:#29845a;--s-verloren:#e22c38;--s-gearchiveerd:#8a8a8a;
--src-vraag-bg:#ffeb78;--src-vraag:#4f4700;--src-best-bg:#cdfee1;--src-best:#0c5132;
--shadow:0 1px 0 0 #1a1a1a12,inset 0 -1px 0 0 #00000021,inset -1px 0 0 0 #00000021,inset 1px 0 0 0 #00000021,inset 0 1px 0 0 #00000021;
--card-shadow:0 1px 0 0 #1a1a1a12,0 0 0 1px #00000014;--shadow-lg:0 8px 16px -4px #1a1a1a33,0 0 0 1px #00000014;
--btn:inset 0 -1px 0 0 #b5b5b5,inset 0 0 0 1px #e3e3e3;--btn-primary:inset 0 -1px 0 1px #000,inset 0 0 0 1px #303030,inset 0 .5px 0 1.5px #ffffff40}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--frame:#161616;--bg:#1f1f1f;--card:#2a2a2a;--ink:#e3e3e3;--soft:#b5b5b5;--faint:#8a8a8a;--line:#3a3a3a;--line-strong:#4a4a4a;--hover:#333;--th:#303030;--chip:#ffffff17;
--accent-soft:#3a2915;--link:#6cb4ff;--side-ink:#e3e3e3;--side-soft:#b5b5b5;--side-hover:#ffffff12;--side-on:#2f2f2f;
--warn:#ffd04a;--warn-bg:#5c4b00;--warn-ink:#ffeb78;--info-bg:#0b3a5c;--info-ink:#a8d8ff;--ok-bg:#0e3b25;--ok-ink:#93f0bd;--bad-bg:#5c1418;--bad-ink:#ffb3b8;--orange-bg:#5c3a12;--orange-ink:#ffd6a4;
--src-vraag-bg:#5c4b00;--src-vraag:#ffeb78;--src-best-bg:#0e3b25;--src-best:#93f0bd;
--card-shadow:0 0 0 1px #ffffff14;--shadow:0 0 0 1px #ffffff1f;--btn:inset 0 0 0 1px #ffffff26;--shadow-lg:0 8px 16px #0009,0 0 0 1px #ffffff1f}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;background:var(--frame)}
body{margin:0;background:var(--frame);color:var(--ink);font:13px/1.45 Inter,-apple-system,BlinkMacSystemFont,"San Francisco","Segoe UI",Roboto,"Helvetica Neue",sans-serif;font-feature-settings:"calt" 0;-webkit-font-smoothing:antialiased}
a{color:var(--link);text-underline-offset:2px;text-decoration:none}a:hover{text-decoration:underline}svg{display:block}
.layout{display:flex;min-height:100vh}

aside{width:240px;flex:none;background:var(--frame);color:var(--side-ink);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:12px 8px 10px;overflow-y:auto}
.brand{display:flex;align-items:center;gap:9px;color:var(--ink);text-decoration:none;font-weight:650;font-size:14px;padding:2px 8px 12px;line-height:1.2}.brand:hover{text-decoration:none}
.brand small{display:block;font-weight:450;font-size:11.5px;color:var(--side-soft)}
.logo{width:30px;height:30px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.08);display:grid;place-items:center;flex:none}.logo img{width:24px;height:24px;display:block}
.gsearch{position:relative;margin:0 4px 10px}.gsearch svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--faint);pointer-events:none}
.gsearch input{margin:0;height:32px;padding:0 44px 0 30px;border-radius:10px;background:var(--card);border:0;box-shadow:inset 0 0 0 1px var(--line)}
.gsearch kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);font:11px/1 inherit;color:var(--faint);pointer-events:none}
aside nav{display:flex;flex-direction:column;gap:1px;flex:1}
aside .group{font-size:12px;font-weight:550;color:var(--side-soft);padding:14px 10px 4px}
aside nav a{display:flex;align-items:center;gap:8px;padding:5px 8px;min-height:30px;border-radius:8px;color:var(--side-ink);text-decoration:none;font-size:13px;font-weight:550}
aside nav a svg{width:18px;height:18px;flex:none;color:#4a4a4a;stroke-width:1.75}
aside nav a .l{flex:1}
aside nav a:hover{background:var(--side-hover);text-decoration:none}
aside nav a.on{background:var(--side-on);font-weight:650;box-shadow:0 1px 0 #0000000d}
aside nav a.sub{padding:4px 8px 4px 34px;min-height:28px;font-weight:450;color:var(--side-soft)}aside nav a.sub.on{color:var(--ink);font-weight:600;background:transparent;box-shadow:none}aside nav a.sub:hover{background:var(--side-hover)}
.badge{font-size:11.5px;font-weight:550;min-width:20px;text-align:center;padding:0 7px;line-height:20px;border-radius:8px;background:#0000000f;color:var(--ink)}
.badge.warn{background:var(--bad-bg);color:var(--bad-ink)}
.me{display:flex;align-items:center;gap:9px;margin-top:10px;padding:8px;border-radius:10px;font-size:13px}.me:hover{background:var(--side-hover)}
.me .who{flex:1;min-width:0;line-height:1.3}.me .who b,.me .who span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.me .who b{font-weight:600}.me .who span{color:var(--side-soft);font-size:12px}
.me a{color:var(--side-soft);padding:5px;border-radius:8px}.me a:hover{color:var(--ink);background:var(--side-hover)}.me a svg{width:16px;height:16px}
.avatar{width:28px;height:28px;border-radius:8px;background:#e8a0bf;color:#3d1529;display:inline-grid;place-items:center;font-weight:650;font-size:11px;flex:none}
.avatar.sm{width:22px;height:22px;font-size:9.5px;border-radius:6px;background:var(--chip);color:var(--soft)}

.main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg);margin:8px 8px 8px 0;border-radius:12px;box-shadow:0 0 0 1px #0000000a;min-height:calc(100vh - 16px)}
.topbar{display:none}
main{width:100%;max-width:1100px;margin:0 auto;padding:20px 24px 72px}main.wide{max-width:none}
h1{font-size:20px;line-height:1.3;margin:0 0 16px;font-weight:700;letter-spacing:-.01em}h2{font-size:14px;margin:0 0 12px;font-weight:650}
.head{display:flex;justify-content:space-between;align-items:center;gap:10px 16px;flex-wrap:wrap;margin-bottom:16px}.head h1{margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.head .sub{margin:2px 0 0;color:var(--soft)}.head h2{margin:0}
.ph{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}.ph .title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:650;flex:1;min-width:0}.ph .title svg{width:18px;height:18px}
.ph h1{font-size:20px;margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ph .back{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;color:var(--ink)}.ph .back:hover{background:var(--chip)}.ph .back svg{width:18px;height:18px}
.ph .meta{flex-basis:100%;color:var(--soft);margin:-4px 0 0 36px}
.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.card{background:var(--card);border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:var(--card-shadow)}
.card.flush{padding:0;overflow:hidden}.card-h{display:flex;align-items:center;gap:8px;padding:12px 16px}.card-h h2{margin:0;flex:1;display:flex;align-items:center;gap:8px}
.card-f{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--line)}
.card .sec{border-top:1px solid var(--line);margin:14px -16px 0;padding:14px 16px 0}
.grid{display:grid;gap:16px}.grid>*{min-width:0}.side-first{order:-1}@media(min-width:900px){.grid.two{grid-template-columns:minmax(0,2fr) minmax(280px,1fr)}.side-first{order:0}}
.muted{color:var(--soft)}.small{font-size:12px}.warn{color:var(--warn)}

.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin-bottom:16px}
.stat{background:var(--card);border-radius:12px;padding:12px 16px;text-decoration:none;color:var(--ink);box-shadow:var(--card-shadow);transition:background .12s}
.stat:hover{background:var(--hover);text-decoration:none}
.stat span{display:flex;align-items:center;gap:7px;color:var(--soft);font-size:12.5px;font-weight:550}
.stat b{display:block;font-size:22px;line-height:1.2;margin-top:4px;font-weight:700;font-variant-numeric:tabular-nums}.stat b.warn{color:var(--bad-ink)}
.st-nieuw{--c:var(--s-nieuw)}.st-in_behandeling{--c:var(--s-in_behandeling)}.st-offerte_verstuurd{--c:var(--s-offerte_verstuurd)}
.st-gewonnen{--c:var(--s-gewonnen)}.st-verloren{--c:var(--s-verloren)}.st-gearchiveerd{--c:var(--s-gearchiveerd)}.st-offerte{--c:var(--s-in_behandeling)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--c,currentColor);display:inline-block;flex:none}

/* KPI strip (orders) */
.kpis{display:flex;align-items:stretch;background:var(--card);border-radius:12px;box-shadow:var(--card-shadow);margin-bottom:12px;overflow-x:auto}
.kpis .period{display:flex;align-items:center;padding:10px 12px;border-right:1px solid var(--line);flex:none}
.kpis .period select{margin:0;height:28px;width:auto;border:0;box-shadow:var(--btn);border-radius:8px;font-weight:550;font-size:12px;padding:0 28px 0 10px;background-color:var(--card)}
.kpi{flex:1 0 150px;padding:10px 16px;display:flex;flex-direction:column;justify-content:center;gap:2px;position:relative}
.kpi+.kpi{border-left:1px solid var(--line)}
.kpi span{font-size:12px;font-weight:600;text-decoration:underline dotted var(--line-strong);text-underline-offset:3px}
.kpi b{font-size:14px;font-weight:650;font-variant-numeric:tabular-nums}
.kpi svg.spark{position:absolute;right:14px;bottom:12px;width:44px;height:16px;color:#4fb8f7}

.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
th{font-size:12px;color:var(--soft);font-weight:550;background:var(--th);white-space:nowrap}
.card>table th:first-child,.card .scroll>table th:first-child{border-top-left-radius:0}
tbody tr:last-child td{border-bottom:0}tbody tr:hover td{background:var(--hover)}
td a{color:var(--ink);font-weight:600;text-decoration:none}td a:hover{text-decoration:underline}
td.num,th.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.card:not(.flush)>.scroll{margin:0 -16px}.card:not(.flush)>.scroll:last-child{margin-bottom:-16px}
.card:not(.flush)>.scroll th:first-child,.card:not(.flush)>.scroll td:first-child{padding-left:16px}.card:not(.flush)>.scroll th:last-child,.card:not(.flush)>.scroll td:last-child{padding-right:16px}
.prices td{padding:5px 8px}
table.itable td{padding:6px 12px;height:37px;white-space:nowrap}table.itable th{padding:7px 12px}
table.itable tr[data-href]{cursor:pointer}table.itable td.sel,table.itable th.sel{width:36px;padding-right:0}
table.itable input[type=checkbox]{width:16px;height:16px;margin:0;accent-color:#303030}
table.itable .strong{font-weight:650}table.itable td.cust{max-width:220px;overflow:hidden;text-overflow:ellipsis}

/* Badges (Polaris): grey by default, a dot or ring for progress. */
.chip,.b{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:550;line-height:16px;background:var(--chip);color:var(--ink);white-space:nowrap;vertical-align:middle}
.chip[class*=" st-"]::before,.chip[class*=" os-"]::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.b::before{content:"";width:8px;height:8px;border-radius:50%;box-sizing:border-box;flex:none}
.b.done::before{background:currentColor;opacity:.75}.b.todo::before{border:1.5px solid currentColor}.b.half::before{background:linear-gradient(90deg,currentColor 50%,transparent 50%);border:1.5px solid currentColor}.b.plain::before{display:none}
.b.attention,.chip.warn{background:var(--warn-bg);color:var(--warn-ink)}.b.warning{background:var(--orange-bg);color:var(--orange-ink)}.b.info{background:var(--info-bg);color:var(--info-ink)}
.b.success{background:var(--ok-bg);color:var(--ok-ink)}.b.critical{background:var(--bad-bg);color:var(--bad-ink)}
.src{font-size:11.5px;font-weight:550;padding:1px 8px;border-radius:8px;white-space:nowrap;flex:none;background:var(--chip);color:var(--ink);line-height:1.5}
.src.vraag{background:var(--src-vraag-bg);color:var(--src-vraag)}.src.bestelling{background:var(--src-best-bg);color:var(--src-best)}.src.manueel{background:var(--chip);color:var(--soft)}

label{display:block;font-size:13px;font-weight:450;color:var(--ink);margin-bottom:12px}
input,select,textarea{display:block;width:100%;margin-top:4px;height:32px;padding:0 10px;border:1px solid #8a8a8a;border-radius:8px;background:var(--card);color:var(--ink);font:inherit;font-size:13px;transition:border-color .12s,box-shadow .12s}
input[type=checkbox],input[type=radio]{accent-color:#303030}
select{appearance:none;-webkit-appearance:none;background-image:${CHEVRON};background-repeat:no-repeat;background-position:right 8px center;padding-right:30px;cursor:pointer}
textarea{height:auto;min-height:84px;padding:8px 10px;resize:vertical}
input::placeholder,textarea::placeholder{color:var(--faint)}
input:hover,select:hover,textarea:hover{border-color:#616161}
input:focus,select:focus,textarea:focus{outline:2px solid var(--focus);outline-offset:1px;border-color:#616161}
.fields{display:grid;gap:0 12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
form.inline{display:flex;gap:8px;flex-wrap:wrap;align-items:end}form.inline label{margin:0}form.inline input,form.inline select{width:auto;min-width:160px}
button,.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:28px;padding:0 12px;border:0;border-radius:8px;background:linear-gradient(180deg,#3b3b3b,#303030);color:#fff;box-shadow:var(--btn-primary);font:inherit;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .12s}
button:hover,.btn:hover{background:#1a1a1a;text-decoration:none}button:active,.btn:active{box-shadow:inset 0 2px 1px #000}
button:focus-visible,.btn:focus-visible,a:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
.btn svg,button svg{width:15px;height:15px}
.btn.ghost,button.ghost{background:var(--card);color:var(--ink);box-shadow:var(--btn)}.btn.ghost:hover,button.ghost:hover{background:var(--hover)}.btn.ghost:active{box-shadow:inset 0 1px 2px #0000001f,inset 0 0 0 1px #ccc}
.btn.plain{background:none;box-shadow:none;color:var(--link);padding:0 4px}.btn.plain:hover{text-decoration:underline;background:none}
.btn.danger{background:var(--card);color:var(--bad-ink);box-shadow:var(--btn)}
.btn.sm{height:26px;padding:0 10px}.btn.icon{width:28px;padding:0}
button.tick{width:20px;height:20px;padding:0;border-radius:6px;border:1.5px solid #8a8a8a;background:transparent;color:var(--ink);box-shadow:none;font-size:12px;line-height:1;margin-top:1px}
button.tick:hover{border-color:var(--ink);background:transparent}button.tick.on{background:#303030;border-color:#303030;color:#fff}

/* "More actions" menu: a <details> that pops over. */
details.menu{position:relative}details.menu>summary{list-style:none}details.menu>summary::-webkit-details-marker{display:none}
details.menu>.pop{position:absolute;right:0;top:calc(100% + 4px);z-index:10;background:var(--card);border-radius:12px;box-shadow:var(--shadow-lg);padding:6px;min-width:230px}
details.menu>.pop form{margin:0}details.menu>.pop:not(.panel)>form>button,details.menu>.pop:not(.panel)>a{display:flex;width:100%;justify-content:flex-start;background:none;box-shadow:none;color:var(--ink);font-weight:450;font-size:13px;height:32px;padding:0 10px;border-radius:8px;text-decoration:none}
details.menu>.pop:not(.panel)>form>button:hover,details.menu>.pop:not(.panel)>a:hover{background:var(--hover)}details.menu>.pop .danger{color:var(--bad-ink)}
details.menu>.pop hr{border:0;border-top:1px solid var(--line);margin:6px -6px}

.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.card .toolbar{margin:0;padding:8px;border-bottom:1px solid var(--line)}
.toolbar label{margin:0}
.toolbar .search{position:relative;flex:1 1 240px;margin:0}
.toolbar .search svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--faint);pointer-events:none}
.toolbar .search input{margin:0;padding-left:30px}
.toolbar select{margin:0;width:auto;min-width:130px}
.summary{color:var(--soft);font-size:12px;white-space:nowrap}.summary b{color:var(--ink)}
.seg{display:inline-flex;border-radius:8px;overflow:hidden;background:var(--card);box-shadow:var(--btn)}
.seg a{display:inline-flex;align-items:center;gap:6px;padding:0 10px;height:28px;color:var(--soft);text-decoration:none;font-size:12px;font-weight:600}
.seg a+a{border-left:1px solid var(--line)}.seg a.on{background:var(--chip);color:var(--ink)}.seg svg{width:14px;height:14px}

/* Filter tabs (Polaris "views"): pills inside the card's top bar. */
.views{display:flex;align-items:center;gap:2px;padding:6px 8px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--line)}
.views a{padding:5px 10px;border-radius:8px;color:var(--soft);font-weight:550;white-space:nowrap;text-decoration:none}
.views a:hover{background:var(--hover);color:var(--ink)}.views a.on{background:var(--chip);color:var(--ink);font-weight:650}.views .n{color:var(--faint);font-weight:450;margin-left:3px}
.views form{margin-left:auto;display:flex;gap:6px;align-items:center;flex:0 1 300px}.views form .search{flex:1;position:relative}
.views form .search svg{position:absolute;left:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--faint);pointer-events:none}
.views form input{margin:0;height:28px;padding-left:28px;border-color:var(--line)}
.bulk{display:none;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--line);background:var(--hover)}.bulk.on{display:flex}.bulk b{margin-right:auto}
.nojs .bulk{display:flex}
.pager{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-top:1px solid var(--line);color:var(--soft)}
.pager .seg a{color:var(--ink)}.seg a.off{color:var(--faint);pointer-events:none}

.board{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(236px,1fr);gap:12px;overflow-x:auto;padding-bottom:14px;align-items:start;scroll-snap-type:x proximity}
.col{display:flex;flex-direction:column;min-width:0;scroll-snap-align:start}
.col-head{display:flex;align-items:center;gap:8px;padding:0 4px 8px;font-size:13px;min-height:32px}
.col-head b{font-weight:650}.col-head .n{color:var(--soft);font-size:12px;font-variant-numeric:tabular-nums}
.col-head .sum{margin-left:auto;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.col-head .add{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;color:var(--soft);background:var(--card);box-shadow:var(--btn);flex:none}
.col-head .add:hover{color:var(--ink);text-decoration:none}.col-head .add svg{width:14px;height:14px}
.col-body{display:flex;flex-direction:column;gap:8px;min-height:140px;padding:6px;border-radius:12px;background:#0000000a;transition:background .15s,box-shadow .15s}
.col-body.over{background:var(--info-bg);box-shadow:inset 0 0 0 2px var(--focus)}
.empty{display:grid;place-items:center;min-height:110px;color:var(--soft);font-size:12px}
.k{position:relative;display:block;background:var(--card);border-radius:10px;padding:10px 12px;color:var(--ink);text-decoration:none;box-shadow:var(--card-shadow);transition:box-shadow .15s}
.k:hover{box-shadow:var(--shadow-lg);text-decoration:none}.k[draggable=true]{cursor:grab}.k.dragging{opacity:.45}
.k-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.k-name{font-weight:650;font-size:13px;line-height:1.3;overflow-wrap:anywhere}
.k-sub{color:var(--soft);font-size:12px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.k-title{font-size:12.5px;margin-top:6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.k-foot{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:var(--soft)}
.k-foot .amt{margin-left:auto;color:var(--ink);font-weight:650;font-variant-numeric:tabular-nums}
.k-flag{color:var(--bad-ink);font-weight:600}
.k .ping{position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:var(--s-nieuw);border:2px solid var(--bg)}
.more{display:block;text-align:center;font-size:12px;padding:4px;color:var(--soft)}

/* Order detail: line items with thumbnails, money summary, contact rows. */
.li{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}.li:last-child{border-bottom:0}
img.thumb{object-fit:cover}.thumb{width:40px;height:40px;border-radius:8px;flex:none;background:var(--chip) center/cover no-repeat;box-shadow:inset 0 0 0 1px #0000001a;display:grid;place-items:center;color:var(--faint)}.thumb svg{width:18px;height:18px}
.li .what{flex:1;min-width:0}.li .what a{color:var(--link);font-weight:550}.li .q{white-space:nowrap;color:var(--soft);font-variant-numeric:tabular-nums}.li .t{white-space:nowrap;min-width:84px;text-align:right;font-variant-numeric:tabular-nums}
.box{border:1px solid var(--line);border-radius:12px;padding:4px 12px}
.sumrows{display:grid;grid-template-columns:1fr auto auto;gap:6px 16px;align-items:baseline}.sumrows .r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.sumrows .m{color:var(--soft)}
.sumrows .tot{font-weight:650}.sumrows hr{grid-column:1/-1;border:0;border-top:1px solid var(--line);margin:4px 0;width:100%}
.contact{display:flex;flex-direction:column;gap:6px}.contact .row{display:flex;gap:8px;align-items:flex-start}.contact .row svg{width:15px;height:15px;color:var(--soft);margin-top:1px;flex:none}
.card h3{font-size:13px;font-weight:650;margin:0 0 6px}

.timeline{list-style:none;margin:0;padding:0}.timeline li{padding:10px 0;border-bottom:1px solid var(--line)}.timeline li:last-child{border-bottom:0}
.timeline li.event{color:var(--soft);font-size:12.5px}.timeline .meta{font-size:12px;color:var(--soft);margin-bottom:2px}
.timeline li.task{display:flex;gap:10px;align-items:flex-start}form.check{margin:0}
dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}dt{color:var(--soft)}dd{margin:0;overflow-wrap:anywhere}
.flash{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:10px;font-weight:550;box-shadow:var(--shadow-lg);z-index:30;animation:fade 4.5s forwards}
@keyframes fade{0%,85%{opacity:1}100%{opacity:0;visibility:hidden}}
.sync{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--ok-bg);color:var(--ok-ink);padding:8px 12px;border-radius:10px;margin-bottom:14px;font-size:13px}.sync svg{width:16px;height:16px}
.sync.building{background:var(--info-bg);color:var(--info-ink)}.sync.waiting{background:var(--warn-bg);color:var(--warn-ink)}.sync form{margin:0 0 0 auto}
pre.body{white-space:pre-wrap;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace;background:var(--hover);border:1px solid var(--line);padding:10px 12px;border-radius:8px;margin:0;max-height:420px;overflow:auto}
.tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin-bottom:12px}
.tabs a{padding:5px 10px;color:var(--soft);text-decoration:none;font-weight:550;border-radius:8px;white-space:nowrap}
.tabs a.on{color:var(--ink);background:var(--card);box-shadow:var(--card-shadow);font-weight:650}.tabs a:hover{color:var(--ink);background:#0000000a}.tabs .n{font-weight:450;color:var(--faint);font-size:12px}
.os-nieuw{--c:var(--s-nieuw)}.os-bevestigd{--c:var(--s-offerte_verstuurd)}.os-betaald{--c:var(--s-gewonnen)}.os-klaar{--c:var(--s-in_behandeling)}.os-geleverd{--c:var(--s-gearchiveerd)}.os-geannuleerd{--c:var(--s-verloren)}
.steps{display:flex;flex-direction:column;gap:12px}.steps form.act{padding-bottom:12px;border-bottom:1px solid var(--line)}.steps form.act:last-child{border-bottom:0;padding-bottom:0}
.steps form.act button{width:100%}
label.check{display:flex;gap:8px;align-items:center;color:var(--ink);font-weight:450}label.check input{width:auto;height:auto;margin:0}
table.editor td{padding:5px 6px}table.editor input,table.editor select{margin:0}
form.inline-form{display:inline;margin:0}
code{font:12.5px ui-monospace,Menlo,Consolas,monospace;background:var(--chip);padding:1px 6px;border-radius:6px}
details summary{cursor:pointer;color:var(--link);font-weight:450}
.bars{display:flex;align-items:flex-end;gap:6px;height:180px;padding-top:10px}
.bars .bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;height:100%;justify-content:flex-end}
.bars .bar i{display:block;width:100%;max-width:42px;background:#4fb8f7;border-radius:6px 6px 2px 2px;min-height:2px}
.bars .bar span{font-size:11px;color:var(--soft);white-space:nowrap}.bars .bar b{font-size:10.5px;font-weight:600;white-space:nowrap}
.meter{height:8px;border-radius:99px;background:var(--chip);overflow:hidden}.meter i{display:block;height:100%;background:#4fb8f7}
.k-low{color:var(--bad-ink);font-weight:700}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 16px;border-radius:10px;font-weight:550;box-shadow:var(--shadow-lg);z-index:30}

@media(max-width:899px){
.layout{display:block}
aside{position:sticky;top:0;z-index:6;width:auto;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;padding:8px 10px 6px;gap:4px 8px;overflow:visible;border-bottom:1px solid var(--line)}
.brand{padding:2px 4px;flex:1}.brand small{display:none}.logo{width:26px;height:26px}.gsearch{display:none}
aside nav{order:3;flex-basis:100%;flex-direction:row;overflow-x:auto;scrollbar-width:none;margin:0 -10px;padding:2px 8px;gap:2px}aside nav::-webkit-scrollbar{display:none}
aside .group,.me .who{display:none}aside nav a{white-space:nowrap;padding:6px 10px}aside nav a.sub{padding:6px 10px}aside nav a.on{background:var(--card)}
.me{margin:0;padding:0}.main{margin:0;border-radius:0;min-height:0}
main{padding:14px 12px 72px}h1,.ph h1{font-size:18px}
input,select,textarea{font-size:16px}
.toolbar select{flex:1 1 140px}.views form{flex-basis:100%;margin:4px 0 0}.views{flex-wrap:wrap}
.board{grid-auto-columns:84%;margin:0 -12px;padding:0 12px 14px;scroll-padding:0 12px}
.ph .meta{margin-left:0}
.li{flex-wrap:wrap}.li .what{flex:1 1 calc(100% - 52px)}.li .q{margin-left:52px;flex:1}.sumrows{gap:6px 10px}.sumrows .m{font-size:12px}
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
  | "rapporten"
  | "zoeken"
  | "checkout";

/** Counters in the sidebar. */
export type Badges = { nieuw: number; taken: number; takenLaat: number; orders: number; lowStock: number };

export function page(opts: {
  title: string;
  base: string;
  section?: Section;
  user?: { email: string; name: string };
  badges?: Badges;
  flash?: string;
  /** Full width (the pipeline board, the orders table). */
  wide?: boolean;
  /** Prefill of the sidebar search. */
  query?: string;
  body: Safe;
}): string {
  const { base, section, badges } = opts;
  const badge = (n: number | undefined, warn = false) => (n ? html`<span class="badge${warn ? " warn" : ""}">${n}</span>` : "");
  const tab = (key: Section, href: string, label: string, ico: IconName | null, extra: Safe | string = "") =>
    html`<a href="${base}${href}" class="${[!ico && "sub", section === key && "on"].filter(Boolean).join(" ")}"${
      section === key ? raw(' aria-current="page"') : ""
    }>${ico ? icon(ico) : ""}<span class="l">${label}</span>${extra}</a>`;
  // Like Shopify: a section's sub-pages show while you are in that section.
  const open = (...keys: Section[]) => Boolean(section && keys.includes(section));
  const nav = opts.user
    ? html`<form class="gsearch" method="get" action="${base}/zoeken" role="search">${icon("search")}<input name="q" type="search" value="${opts.query ?? ""}" placeholder="Zoeken" aria-label="Zoek bestellingen, klanten en aanvragen" data-hotkey><kbd>Ctrl K</kbd></form>
<nav aria-label="Beheer">
${tab("overzicht", "/", "Start", "home")}
${tab("bestellingen", "/bestellingen", "Bestellingen", "cart", badge(badges?.orders))}
${open("bestellingen", "facturen") ? tab("facturen", "/facturen", "Facturen", null) : ""}
${tab("producten", "/producten", "Producten", "package")}
${open("producten", "voorraad") ? tab("voorraad", "/voorraad", "Voorraad", null, badge(badges?.lowStock, true)) : ""}
${tab("checkout", "/checkout", "Checkout", "truck")}
${tab("klanten", "/klanten", "Klanten", "users")}
${tab("aanvragen", "/aanvragen", "Aanvragen", "inbox", badge(badges?.nieuw))}
${open("aanvragen", "offertes", "taken") ? html`${tab("offertes", "/aanvragen?soort=offertes", "Offertes", null)}${tab("taken", "/taken", "Taken", null, badge(badges?.takenLaat || badges?.taken, Boolean(badges?.takenLaat)))}` : ""}
${tab("rapporten", "/rapporten", "Rapporten", "chart")}
${tab("activiteit", "/activiteit", "Activiteit", "activity")}
<span class="group">Verkoopkanalen</span>
<a href="https://www.natuurhout.be/" target="_blank" rel="noopener">${icon("external")}<span class="l">Webshop natuurhout.be</span></a>
<span style="flex:1"></span>
${tab("instellingen", "/instellingen", "Instellingen", "settings")}
</nav>
<div class="me"><span class="avatar">${initials(opts.user.name || opts.user.email)}</span><span class="who"><b>${opts.user.name || opts.user.email}</b><span>${
        opts.user.email
      }</span></span><a href="/cdn-cgi/access/logout" title="Afmelden" aria-label="Afmelden">${icon("logout")}</a></div>`
    : "";
  return `<!doctype html>${html`<html lang="nl-BE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#ebebeb">
<title>${opts.title} · Natuurhout beheer</title>
<link rel="icon" type="image/png" sizes="64x64" href="${ADMIN_FAVICON}">
<style>${raw(CSS)}</style>
<script src="${base}/app.js" defer></script></head><body>
<div class="layout"><aside><a class="brand" href="${base}/"><span class="logo"><img src="${ADMIN_FAVICON}" alt="" width="24" height="24"></span><span>Natuurhout<small>Beheer</small></span></a>${nav}</aside>
<div class="main"><main${opts.wide ? raw(' class="wide"') : ""}>${opts.flash ? html`<div class="flash" role="status">${opts.flash}</div>` : ""}${opts.body}</main></div></div>
</body></html>`}`;
}
