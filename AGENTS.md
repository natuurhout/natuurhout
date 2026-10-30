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

The WordPress site remains production until an explicit cutover. Do not enable
indexing, add analytics, change DNS, or deploy to the production domain as part
of ordinary development.

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
  (`worker/offerte.ts`, quote requests → Resend). Config: `wrangler.jsonc`.
- **No server code in `src/app`:** route handlers, server actions, `cookies()`,
  `headers()` or on-demand pages do not work in a static export. New API
  endpoints go in the Worker. Dynamic routes need `generateStaticParams`.
- **Deploy:** a push to `main` deploys automatically through Workers Builds
  (Git integration, connected in the Cloudflare dashboard). Manual deploy:
  `npm run deploy` (= build + `wrangler deploy`; needs `npx wrangler login`).
  After a deploy, check the change on the workers.dev URL.
- **Secrets** live in the Worker, never in the repo:
  `npx wrangler secret put RESEND_API_KEY` (optional: `QUOTE_TO`,
  `QUOTE_FROM`). Without `RESEND_API_KEY` the quote route answers 503
  `not-configured` and the page opens the customer's mail program.
- **Build-time env:** `SITE_INDEXING_ENABLED` is read during the build (static
  export). At cutover it must be set in the Workers Builds build variables, not
  as a Worker secret.
- `npm run typecheck` also checks the Worker (`worker/tsconfig.json`). After
  changing `wrangler.jsonc`, run `npm run cf:types`.
