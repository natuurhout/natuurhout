# Natuurhout migration rules

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This project uses Next.js 16. Read the relevant version-matched documentation in
`node_modules/next/dist/docs/` before changing framework APIs, routing, caching,
metadata, images, or configuration. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Source of truth

- `migration/url-inventory.csv` is the frozen 128-URL WordPress SEO baseline.
- `migration/html-snapshot/` is the frozen verbatim content source. Never edit
  snapshot HTML by hand.
- `src/data/legacy-pages.json` is generated. Update it only through
  `npm run migration:extract`.
- Product/catalogue data is in `src/data/products.json` and
  `src/data/collections.json`; catalogue routes live below `/shop/`. This site
  replaces `natuurhout.shop` (Oct 2026): never link to it; orders are sent from
  the price lists as order requests (`OrderRequestForm`).
- Legacy media is mirrored at its original path below
  `public/wp-content/uploads/`. Never reintroduce WordPress hotlinks.

## Required checks

Before pushing, run all four:

1. `npm run typecheck`
2. `npm run migration:audit`
3. `npm run build`
4. `npm run migration:audit:built`

LIVE on Cloudflare Workers since 2026-11-17: the natuurhout.be nameservers at
Combell point to Cloudflare (bill/iris.ns.cloudflare.com); WordPress is retired.

## Hosting: Cloudflare Workers

The site runs on Cloudflare Workers (account info@fx-media.no), Worker name
`natuurhout`, staging URL https://natuurhout.tiny-fire-1523.workers.dev.
Vercel is no longer used (notes in `migration/` that mention Vercel are
historical).

- **How it is served:** `next.config.ts` has `output: "export"`; `npm run build`
  writes the static site to `out/`, which Cloudflare serves as static assets.
  `worker/index.ts` runs first for every request and does what Next did on
  Vercel: the `trailingSlash` 308s, the `redirects()` from `next.config.ts`
  (it imports that file, so edit redirects there only), and `POST /api/offerte/`
  (`worker/offerte.ts`, quote requests → Cloudflare Email Sending). Config: `wrangler.jsonc`.
- **No server code in `src/app`:** route handlers, server actions, `cookies()`,
  `headers()` or on-demand pages do not work in a static export. New API
  endpoints go in the Worker. Dynamic routes need `generateStaticParams`.
- **Deploy:** every push to `main` deploys through GitHub Actions
  (`.github/workflows/deploy.yml`: typecheck → `npm run deploy`, secrets
  `CLAUDE_CLOUDFLARE` (API token) + `CLOUDFLARE_ACCOUNT_ID` on the repo). So: commit,
  push, wait for the green check on the commit, then check the change on
  https://www.natuurhout.be. A red cross means the build or typecheck failed
  and nothing was deployed — open the Actions tab for the error. Manual
  deploy still works from a machine with `npx wrangler login`:
  `npm run deploy`. Workers Builds (Cloudflare's Git integration) is not used.
- **Domains:** `wrangler.jsonc` routes `www.natuurhout.be` + `natuurhout.be`
  as custom domains (zone natuurhout.be on the FX Media Cloudflare account,
  created 2026-11-09). The Worker 301s the apex to www. Mail stays at
  Microsoft 365 (MX/SPF/DMARC copied into the zone). `workers_dev` is
  `false` since 2026-11-17, so there is no duplicate copy on workers.dev.
- **Quote mail (2026-11-09):** Cloudflare Email Sending via the `EMAIL`
  binding (`send_email` in `wrangler.jsonc`, sender `offerte@natuurhout.be`),
  no API key, Resend removed. Email Sending is enabled for natuurhout.be
  (2026-11-17; DKIM `cf-bounce._domainkey`, return path `cf-bounce`). If the
  binding ever rejects the sender, the route answers 503 `not-configured` and
  the page opens the customer's mail program. Optional
  vars: `QUOTE_TO`, `QUOTE_FROM`.
- **Build-time env:** `SITE_INDEXING_ENABLED` is read during the build (static
  export). `.env.production` (committed) sets it to `true`, so `npm run build`
  / `npm run deploy` produce the indexable production site; `next dev` stays
  noindex.
- **Tracking (2026-11-09):** opt-in consent banner (`src/components/CookieConsent.tsx`)
  gates everything in `src/lib/tracking.ts`: GTM `GTM-PNLTC3D` + GA4
  `G-CN9LQB6Q07` (statistics) and Meta Pixel `705295257764810` (marketing),
  Consent Mode v2. Nothing loads before consent. Forms call `trackLead()` on a
  successful send (`generate_lead` on dataLayer/GA4, `Lead` on the pixel).
  No Meta Conversions API (house rule). Footer has a "Cookie-instellingen"
  button that reopens the banner.
- **Images on hand-built pages** use web-sized JPEG copies in `public/fotos/web/`
  (max 1400px). The WordPress originals under `public/wp-content/uploads/` stay
  for the legacy snapshot pages and for Google Images (all image-sitemap URLs of
  the old site resolve). Security headers are set in `worker/index.ts`.
- `npm run typecheck` also checks the Worker (`worker/tsconfig.json`). After
  changing `wrangler.jsonc`, run `npm run cf:types`.

## Backend: CRM at beheer.natuurhout.be (2026-11-17)

- **What:** the Worker serves a small CRM on `beheer.natuurhout.be` (`worker/admin/`):
  sidebar with Overzicht, Aanvragen (+ Offertes/Bestellingen views; every form sent to
  `/api/offerte/` is saved, plus manual ones), Taken (follow-up tasks with due dates),
  Klanten (+ CSV export), Producten (read-only price list from `src/lib/catalog.ts`),
  Activiteit and Instellingen. Server-rendered HTML with plain forms, Dutch UI, no JS.
  `worker/index.ts` dispatches on the hostname, so the public site never reaches it.
- **Data:** Cloudflare D1, binding `DB`, database `natuurhout-crm` (id `4fa6e039-…`, created
  2026-11-17, pinned in `wrangler.jsonc`). The Worker applies the schema
  itself (`worker/crm/schema.ts`): to change it, append a migration, never edit a shipped one.
  Saving a submission is best effort: it never blocks or replaces the quote e-mail.
- **Login:** Cloudflare Access app "Natuurhout beheer (CRM)" on `beheer.natuurhout.be`
  (FX Media Zero Trust org, team domain `fx-media.cloudflareaccess.com`, created 2026-11-17),
  allow policy for info@natuurhout.be and info@fx-media.no (one-time code by e-mail).
  Add a person in both the Access policy and `ADMIN_EMAILS`. The Worker
  verifies the Access JWT as well (`worker/admin/auth.ts`, vars `ACCESS_TEAM_DOMAIN`,
  `ACCESS_AUD`, optional `ADMIN_EMAILS` in `wrangler.jsonc`); with those empty the admin
  refuses everyone. POSTs must be same-origin.
- **Locally:** put `ADMIN_DEV_EMAIL=you@example.com` in `.dev.vars` (gitignored), then
  `npm run build && npm run dev:beheer` and open http://localhost:8787/__beheer/.
  The dev login only works on localhost, never on a deployed Worker.
- **Deploy token:** the GitHub secret `CLAUDE_CLOUDFLARE` has no D1 permission. That is
  fine as long as `database_id` stays pinned in `wrangler.jsonc`; without it the deploy fails.
