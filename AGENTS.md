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

Cutover to Cloudflare Workers prepared 2026-11-09 (zone, DNS, custom domains,
indexable build deployed); it goes live when the natuurhout.be nameservers at
Combell are changed to Cloudflare. Until then WordPress at Combell still answers.

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
  `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` on the repo). So: commit,
  push, wait for the green check on the commit, then check the change on
  https://www.natuurhout.be. A red cross means the build or typecheck failed
  and nothing was deployed — open the Actions tab for the error. Manual
  deploy still works from a machine with `npx wrangler login`:
  `npm run deploy`. Workers Builds (Cloudflare's Git integration) is not used.
- **Domains:** `wrangler.jsonc` routes `www.natuurhout.be` + `natuurhout.be`
  as custom domains (zone natuurhout.be on the FX Media Cloudflare account,
  created 2026-11-09). The Worker 301s the apex to www. Mail stays at
  Microsoft 365 (MX/SPF/DMARC copied into the zone). The workers.dev URL
  gets `X-Robots-Tag: noindex` from the Worker; set `workers_dev: false`
  once the nameserver switch at Combell is verified.
- **Quote mail (2026-11-09):** Cloudflare Email Sending via the `EMAIL`
  binding (`send_email` in `wrangler.jsonc`, sender `offerte@natuurhout.be`),
  no API key, Resend removed. The domain must be onboarded once the zone is
  active: `npx wrangler email sending enable natuurhout.be` (adds the DKIM/SPF
  records). Until then the binding rejects the sender, the route answers 503
  `not-configured` and the page opens the customer's mail program. Optional
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
