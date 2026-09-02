# WordPress migration status

Updated: 2026-09-02

## Verified now

- Local checkout: `C:\dev\natuurhout`
- Git remote: `https://github.com/XanderDijkstra/natuurhout.git`
- Live canonical host: `https://www.natuurhout.be/`
- Today's seven non-attachment WordPress sitemaps still contain exactly the same
  128 content URLs as the 2026-08-16 baseline. No additions or removals were
  found.
- All 128 baseline URLs are covered in the rebuild:
  - 119 preserved WordPress content routes
  - 9 redirects that already exist on WordPress
- The new commerce layer is separate from legacy content: `/shop/`,
  `/shop/kastanje/`, and 41 static product-detail routes. Existing staging links
  below `/producten/:handle` redirect to `/shop/:handle/`.
- `npm run typecheck`, `npm run migration:audit`, and the Next.js 16.3.4
  Turbopack production build pass.
- `npm audit` reports zero known vulnerabilities.
- Browser checks passed for the homepage, the legacy `/producten/` grid, the
  image-heavy kastanje project page, and `/shop/kastanje-rasterwerk/` on the
  local production server.
- The GitHub-connected Vercel project deployed the main branch successfully as
  a protected Production deployment. Authenticated deployment checks confirmed
  the contact page, article, project page, and the final 161-URL sitemap.

## Implemented in this pass

- Clean build-time extraction from frozen WordPress HTML into preserved content
  trees, retaining exact text, headings, columns, tables, galleries and links.
- Static catch-all route with page-specific metadata and canonicals.
- Search-engine sitemap covering legacy, shop, and calculator routes without
  duplicate entries.
- 594 WordPress assets mirrored at their original `/wp-content/uploads/` paths;
  the built-output asset audit blocks missing files and old-host hotlinks.
- Built-output parity audit checks heading, text, link and image sequences across
  all 119 preserved content routes.
- Staging remains `noindex` and robots-disallowed.
- Next.js upgraded from 15 to patched 16.3.4.

## Cutover blockers

1. **Forms:** the original WordPress form fields and layout are preserved, but
   their WordPress/Forminator submission runtime is deliberately not carried
   over. Before cutover, replace submission behavior with a real endpoint,
   confirm recipient/CC/auto-reply and attachment limits, and test a recorded
   end-to-end submission.
2. **Consent and tracking:** no GTM or consent banner is active in the rebuild.
   Confirm `GTM-PNLTC3D`, GA4 `G-CN9LQB6Q07`, Meta Pixel `705295257764810`,
   consent categories, and conversion events before adding them.
3. **Commerce media ownership:** all WordPress media used by the migration is
   local. Product images still use Shopify's CDN while Shopify remains the
   checkout/source catalogue; decide whether to localize those when checkout is
   moved fully into `/shop/`.
4. **Business identity:** the current site states BEHO comm.v, VAT
   `BE 0841.894.771`, Adolf Van Der Moerenstraat 39, 9240 Zele. Reconfirm the
   exact current KBO/Google Business Profile string before cutover. This pass did
   not obtain the entity record from KBO Public Search.
5. **Legacy cleanup decision:** `/logout/` is an empty WordPress account remnant.
   The rebuild currently preserves a 200 route. Approve a 301 or 410 together
   with the other kill-list candidates in `phase0-report.md` before launch.
6. **Cutover deployment:** the Vercel project is connected and builds `main`, but
   deployment protection is active and `natuurhout.be` still points to
   WordPress. No domain binding, DNS change, indexing change, or WordPress
   shutdown was performed in this pass.

## Cutover sequence

1. Resolve the six blockers above.
2. Run `npm run migration:extract`, `npm run typecheck`,
   `npm run migration:audit`, and `npm run build` on the final commit.
3. Deploy to a protected preview and crawl every baseline URL, verifying status,
   canonical, title, description, H1, internal links, and images.
4. Submit test contact and quote requests, including an attachment, and verify
   the provider record plus recipient delivery.
5. Verify consent defaults and analytics events in a clean browser session.
6. Run the built asset audit and spot-check original `/wp-content/uploads/`
   links used outside the website (ads, email, documents).
7. Point the domain to the new deployment but leave WordPress recoverable.
8. Confirm the deployment is Production and verify real pages in a browser.
9. Only then change metadata/robots from `noindex` to indexable and publish the
   final sitemap.
10. Monitor 404s, form delivery, Search Console, analytics, and redirects for at
    least two weeks before retiring WordPress infrastructure.
