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
  `src/data/collections.json`; catalogue routes live below `/shop/`, while
  purchases still complete on `natuurhout.shop` until checkout is migrated.
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
