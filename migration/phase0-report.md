# Phase 0 — Inventory Report: natuurhout.be

Crawled live on **2026-08-16** directly from this environment (no Screaming Frog export needed — the site is reachable). All artifacts in this folder are generated from that crawl. **No application code has been written; this report awaits Xander's sign-off.**

## 0. Headline facts

| Fact | Value |
|---|---|
| Canonical host | `https://www.natuurhout.be/` (**with www** — non-www 301s to www) |
| CMS | WordPress + Elementor (4.2.0) + Goodlayers theme `nat`, All in One SEO 4.9.10 |
| Indexable URLs (sitemap) | **128** — all return 200 (9 of them are 301s to other inventoried pages) |
| Attachment URLs in sitemap | 476 |
| Unique `wp-content/uploads` files referenced in HTML | 863 (see `media-uploads-referenced.txt`) |
| Language | **Dutch only.** No hreflang anywhere, no /fr/ or /en/ paths, no language switcher. Live uses `lang="nl-NL"`; per the migration prompt the new site uses `nl-BE`. No hreflang-parity blocker. |
| Robots | No `noindex` anywhere; all pages `max-image-preview:large`. Trailing-slash URLs are canonical (non-slash 301s to slash). |
| WordPress REST API | **Fully open** (`/wp-json/wp/v2/` pages, posts, media, types) — content export does not need a WXR file, though one is still welcome as backup. |
| Legal entity | BEHO comm.v (from algemene voorwaarden) |

**NAP as found on the site** (to be verified against Google Business Profile by Xander):
Natuurhout / BEHO comm.v · Adolf Van Der Moerenstraat 39, 9240 Zele, België · +32 5 255 88 58 · +32 473 74 09 26 · info@natuurhout.be

## 1. URL inventory

`url-inventory.csv` — one row per sitemap URL with: status, final URL if redirected, title, meta description, H1 (+count), canonical, robots, lang, og:title, JSON-LD schema types, word count, shop links.

Notable:
- **9 sitemap URLs are server-side 301s** to other pages (e.g. `/kastanje-palen/` → `/`, `/plantenbakken-kopen/` → `/project/moestuinbak/`). These are *existing* redirects on live, so the new site reproduces them as 301s in `next.config` — this does not violate the zero-redirect goal (they don't serve content today either).
- Many H1s are empty (Elementor pages using styled headings that aren't `<h1>`). Parity rule: reproduce the live heading structure as-is, including absent H1s — do not "fix" by inventing H1s.
- `/eiusmod-tempor-incidunt/` is a **real Dutch article** ("Een hottub voor ultieme ontspanning") living on a leftover lorem-ipsum slug. URL parity keeps the slug.

## 2. Language check — PASS

Dutch-only site. No FR/EN variants, no hreflang. No architecture change needed.

## 3. Template archetypes (128 URLs)

| # | Archetype | Count | Example | Build approach |
|---|---|---|---|---|
| 1 | Homepage | 1 | `/` | Hand-built page |
| 2 | Product/assortment pages | ~14 | `/producten/`, `/landelijke-afsluiting/`, `/houten-tuinpoorten/`, `/kastanjelatten-kopen/` | Hand-built on shared section components |
| 3 | Project/product detail (`/project/*`) | 46 | `/project/rasterwerk-kastanjehout/` | **Data-driven template** (portfolio CPT). Note: several `/project/*` pages double as product pages with buy intent |
| 4 | Project category archive (`/project_category/*`) | 17 | `/project_category/vlechtschermen/` | Data-driven archive template |
| 5 | Blog/info article (Article schema) | 17 | `/wat-is-kastanjehout/` | Data-driven article template, content via REST API |
| 6 | Blog category archives | 6 | `/category/blog/` | Data-driven archive template |
| 7 | Tag archives | 8 | `/tag/kastanjehout/` | Same archive template |
| 8 | Info/advice hub pages | ~7 | `/natuurhoutadvies/`, `/tipsenideeen/`, `/veelgesteldevragen/`, `/diyplaatsing/` | Hand-built on shared components |
| 9 | About | 2 | `/over-ons/`, `/about-us/` | Hand-built |
| 10 | Contact & offerte | 2 | `/contact/`, `/offerte-aanvragen/` | Hand-built + real form components |
| 11 | Legal | 5 | `/privacyverklaring/`, `/algemene-voorwaarden-van-beho-comm-v/`, `/cookiebeleid-eu/`, `/gebruiksvoorwaarden/`, `/verzoek-toegang-tot-data/` | Hand-built, verbatim blocks marked "do not edit" |
| 12 | Aanbiedingen | 1 | `/aanbiedingen-2/` | Hand-built |
| 13 | Redirect-only sitemap entries | 9 | `/kastanje-palen/` | 301 map in next.config (mirrors live behavior) |
| 14 | **Kill-list candidates** (below) | ~11 | `/logout/` | Xander decision |

### 3a. Proposed kill/301 list — NEEDS XANDER'S APPROVAL

These are live and indexable today but look like WordPress/WooCommerce/theme leftovers. Proposal per URL (nothing killed without sign-off; default if declined = reproduce as-is):

| URL | What it is | Proposal |
|---|---|---|
| `/change-password/`, `/lost-password/`, `/view-order/`, `/logout/` | WooCommerce account endpoints (no shop runs on .be) | 301 → `/` or 410 |
| `/category/fit-row/`, `/category/life-style/`, `/category/post-slider/`, `/category/video/`, `/category/uncategorized/` | Theme-demo blog categories with little real content | 301 → `/category/blog/` |
| `/homepage-natuurhout-kastanje-afsluiting-kastanjehouten-hekwerk/` and `-2/` | Old homepage builds, near-duplicates of `/` | 301 → `/` |
| `/project_category/all/` | "All" archive duplicating `/project/` | Keep or 301 → `/projecten/` |

Everything else is preserved 1:1.

## 4. Content export plan

- **Posts/articles (archetype 5):** pull `content.rendered`, `date`, `modified`, `slug`, `title`, `excerpt`, featured media via REST API (`/wp-json/wp/v2/posts`, open, tested). Article schema on the new site uses these real dates.
- **Elementor pages (archetypes 1–2, 8–12):** REST `content.rendered` is unreliable for Elementor layouts, so the **crawled rendered HTML is the verbatim-copy source** (saved for all 128 pages during this crawl). Copy is lifted word-for-word from the rendered DOM.
- **Portfolio CPT (`/project/*`):** REST API exposes the type; detail data (title, gallery images, body, category terms) extracted per page from rendered HTML + REST where available, into a typed data file that drives the template.
- Cleanup of Elementor/shortcode wrapper markup happens as render-time transforms in the new codebase; the saved source HTML is never edited.
- WXR export from Xander: **optional backup, not a blocker.**

## 5. Media plan

- 476 attachment-sitemap URLs; 863 unique upload files referenced across the 128 pages (`media-uploads-referenced.txt`), spanning uploads from 2019–2026.
- Mirror all referenced files into `public/wp-content/uploads/` — **identical URLs**, preserving image search traffic. Total size to be measured at download time; if it exceeds comfortable repo size we move to Vercel-friendly storage while keeping the same URL paths (decision recorded then, path contract unchanged).
- WebP/next-image optimization only through wrappers that keep the original URL resolving.
- Galleries on `/project/*` pages are image-heavy → template gets lazy loading + explicit width/height (CLS) from day one.

## 6. Tracking inventory

What actually loads on live (in load order):

| Tag | ID | Loader | Consent gating |
|---|---|---|---|
| GTM container | **GTM-PNLTC3D** | Inline GTM snippet (via "Simple Custom CSS and JS" plugin) + noscript iframe | Complianz |
| Google tag (second loader!) | **GTM-NXNW4NXX** (`gtag/js`, custom dataLayer `dataLayerPYS`) | PixelYourSite plugin | Complianz |
| GA4 | **G-CN9LQB6Q07** | via PixelYourSite config | statistics category |
| Meta Pixel | **705295257764810** (PageView + advanced matching) | PixelYourSite | marketing category |
| Consent banner | Complianz GDPR (`consenttype: optin`, categories functional/preferences/statistics/marketing) | plugin | — |
| Second GDPR plugin | WP GDPR Compliance (front.js loads too) | plugin | — |
| reCAPTCHA | Google reCAPTCHA (Forminator) | plugin | — |
| WhatsApp chat | wp-whatsapp-chat widget | plugin | — |
| Google Maps | Snazzy Maps | plugin | — |

**Migration decision (per rule 6):** the new site loads **only GTM-PNLTC3D**; GA4 + Meta Pixel move inside that container (Xander grants GTM access; we verify GA4/pixel are configured there or add them, then the PYS-style double Google loader disappears — today GTM-NXNW4NXX + GTM-PNLTC3D risk double-counting). Consent: reproduce opt-in category gating equivalent to Complianz (marketing/statistics blocked until consent) via GTM Consent Mode. **Conversions today:** PYS fires PageView-level events; no explicit form-conversion event found in the HTML — form thank-you conversion setup to be confirmed with Xander in GTM/GA4.

## 7. Forms

Both forms are **Forminator** (AJAX post to WordPress admin-ajax; destination is plugin-configured email — **Xander to confirm recipient**, `info@natuurhout.be` assumed):

- **Contact** (`/contact/`, module 6005 + site-wide footer module 6004): Naam, Email, Bericht/Vraag.
- **Offerte** (`/offerte-aanvragen/`, module 6091): full quote configurator — product checkboxes (kastanje/robinia/hazelaar rasterwerk, vlechtschermen, post & rail, lariks, maatwerk, poorten, palen), per-product quantity/meter fields, Naam, E-mail, Telefoon, Adres & Huisnummer, Stad & Postcode, notities, **file upload**, reCAPTCHA.

New site: native forms posting to `/api/lead/` relaying to the same email destination; honeypot + GDPR consent checkbox; conversion event via dataLayer on thank-you. File upload on the offerte form needs an upload relay (size limits to confirm).

## 8. Shop-link inventory

`shop-link-inventory.csv` — 274 links across all 128 pages. Pattern:
- Header + footer "**Naar webshop**" buttons → `https://natuurhout.shop/` on every page (2–4× per page).
- In-body CTAs ("webshop", "bestelling", "plaats meteen uw bestelling") → `https://natuurhout.shop/`.
- One deep link: `/project/rasterwerk-kastanjehout/` → `https://natuurhout.shop/products/kastanje-rasterwerk` (URL shape suggests **Shopify** — relevant intel for the later Shop phase, not acted on now).
- One `https://www.natuurhout.shop` (www, no path) on `/veelgesteldevragen/`.

All preserved verbatim per rule 8.

## 9. Schema on live (baseline for parity)

Site-wide: Organization, WebSite, BreadcrumbList, ImageObject. Articles: Article + Person (17 pages). Archives: CollectionPage. **No LocalBusiness, no Product, no FAQPage on live** — the prompt's "upgrade where safe" allows adding LocalBusiness (real NAP) site-wide; FAQPage only on `/veelgesteldevragen/` if its content is real Q&A (it is — to be implemented from verbatim content).

## 10. Open items for Xander (blocking sign-off)

1. **Approve/adjust the kill/301 list** in §3a (or we ship all of them 1:1).
2. **GTM access** (GTM-PNLTC3D) + confirm GA4 `G-CN9LQB6Q07` and Meta Pixel `705295257764810` should carry over; confirm what counts as a conversion today.
3. **Form destination**: confirm where Forminator submissions go (email address(es)? CC? auto-reply?) and max upload size for offerte attachments.
4. **NAP check** against Google Business Profile (§0) — exact string wins.
5. **Repo/Vercel/Supabase names** (prompt fill-ins). Recommendation: **skip Supabase** — Phase 0 found no embeds needing it; forms are plain relays. Admin-editable content can come later if wanted.
6. **Design direction + brand tokens** (prompt fill-ins) — or I propose tokens from the logo/current palette at the start of Phase 1.
7. **Logo + font files** when available (font-face slots will be pre-wired).
8. Optional: WXR export as content backup.
