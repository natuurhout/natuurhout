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
  - 5 purpose-built routes
  - 114 generated static legacy routes
  - 9 redirects that already exist on WordPress
- The new catalogue adds 41 static product-detail routes plus the calculator.
- `npm run typecheck`, `npm run migration:audit`, and the Next.js 16.3.4
  Turbopack production build pass.
- `npm audit` reports zero known vulnerabilities.
- Browser checks passed for the homepage, a long article, and an image-heavy
  project page on the local production server.
- The GitHub-connected Vercel project deployed the main branch successfully as
  a protected Production deployment. Authenticated deployment checks confirmed
  the contact page, article, project page, and the final 161-URL sitemap.

## Implemented in this pass

- Clean build-time extraction from frozen WordPress HTML into structured JSON.
- Static catch-all route with page-specific metadata and canonicals.
- Search-engine sitemap covering legacy, catalogue, and calculator routes.
- Purpose-built contact, quote, and offers pages.
- Staging remains `noindex` and robots-disallowed.
- Next.js upgraded from 15 to patched 16.3.4.

## Cutover blockers

1. **Forms:** contact and quote requests currently open a prefilled email in the
   visitor's mail program. Before cutover, wire a real endpoint, confirm the
   recipient/CC/auto-reply, define attachment limits, and test a recorded
   end-to-end submission.
2. **Consent and tracking:** no GTM or consent banner is active in the rebuild.
   Confirm `GTM-PNLTC3D`, GA4 `G-CN9LQB6Q07`, Meta Pixel `705295257764810`,
   consent categories, and conversion events before adding them.
3. **Media ownership:** migrated pages and the header still hotlink WordPress
   uploads; product images hotlink Shopify. Mirror the 863 referenced WordPress
   files before retiring WordPress, while preserving `/wp-content/uploads/...`
   paths.
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
6. Mirror media and test every `/wp-content/uploads/` URL used by the new site.
7. Point the domain to the new deployment but leave WordPress recoverable.
8. Confirm the deployment is Production and verify real pages in a browser.
9. Only then change metadata/robots from `noindex` to indexable and publish the
   final sitemap.
10. Monitor 404s, form delivery, Search Console, analytics, and redirects for at
    least two weeks before retiring WordPress infrastructure.
