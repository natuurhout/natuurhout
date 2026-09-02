# Natuurhout WordPress to Vercel checklist

Adapted for this repository from the user-provided I&E Migration Playbook.

## Governing rule

Take the WordPress site over 1:1 first to protect existing rankings. Preserve
URLs, content, headings, metadata, links and assets exactly. The visual design
may change. Improvements are additive and ship after parity is proven.

## Inventory and capture

- [x] Crawl the live sitemap universe: 128 baseline URLs.
- [x] Preserve dated HTML snapshots per URL.
- [x] Map routes into page, project and archive templates.
- [ ] Obtain and archive a WXR export to expose non-sitemap funnels, attachment
  metadata, authors, revisions and hidden redirects.
- [ ] Compare WXR URLs against the 128-URL crawl and classify every delta:
  migrate, preserve noindex, redirect, or intentionally remove.
- [ ] Re-capture the live site immediately before the final parity sweep because
  WordPress can change during the migration.

## URL and content parity

- [x] `trailingSlash: true`.
- [x] Original content URLs remain byte-identical.
- [x] Original titles, descriptions and canonicals preserved per page.
- [x] Original content tree retained: heading levels, text, links, tables,
  galleries, forms and image order.
- [x] Existing WordPress redirects mirrored from the crawl.
- [ ] Crawl every internal link in built output, collapse redirect chains and
  add any historical aliases missing from the sitemap inventory.
- [ ] Confirm per-page index/noindex parity; the entire staging deployment stays
  noindex until cutover.

## Assets

- [x] WordPress media localized below the original
  `/wp-content/uploads/...` paths.
- [x] Built-output audit fails on missing assets or WordPress hotlinks.
- [ ] Audit external references to the domain, including ads, email automations
  and PDFs, not only links emitted by the website.
- [ ] Decide Shopify CDN ownership when checkout moves fully into `/shop/`.

## Forms, tracking and integrations

- [ ] Replace WordPress/Forminator form submission with a native endpoint.
- [ ] Store every lead before forwarding so delivery failure cannot lose it.
- [ ] Test contact and quote flows end to end, including an attachment.
- [ ] Add consent-aware GTM/GA4/Meta only after IDs and event requirements are
  confirmed; GTM should be the sole tag loader.
- [ ] Verify every conversion event on its real thank-you state.

## Automated gates

- [x] `npm run migration:audit` proves all baseline routes are accounted for.
- [x] `npm run migration:audit:built` proves emitted heading, text, link, image
  and asset parity.
- [x] `npm run typecheck` and `npm run build` are push gates.
- [ ] Add a final deployed-route sweep that compares status, canonical, title,
  description, H1 sequence, internal links and images against WordPress.

## Cutover

- [ ] Resolve every blocker in `MIGRATION-STATUS.md`.
- [ ] Lower DNS TTL and keep WordPress recoverable as the rollback target.
- [ ] Verify the Vercel deployment is Production, not Preview.
- [ ] Run the full deployed-route and asset sweep on the production hostname.
- [ ] Enable indexing only after production parity and real form submissions pass.
- [ ] Monitor Search Console, 404s, lead delivery and analytics for 2–4 weeks.
- [ ] Ship redesign/content improvements one at a time after the monitoring window.
