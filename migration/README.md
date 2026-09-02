# migration/ — Phase 0 inventory artifacts (natuurhout.be → Next.js)

Current implementation and cutover blockers are tracked in
`MIGRATION-STATUS.md`. The files below remain the frozen 2026-08-16 source
baseline.

Generated 2026-08-16 from a live crawl of https://www.natuurhout.be/.

- `phase0-report.md` — the Phase 0 report: archetypes, tracking, forms, media, shop links, kill-list proposal, open questions. **Read this first.**
- `url-inventory.csv` — per-URL SEO parity baseline (title/meta/H1/canonical/robots/schema/word count). This is the diff target for every parity audit.
- `html-snapshot/` — rendered HTML of all 128 indexable pages, frozen at inventory date. **This is the verbatim-copy source of record.** Copy Dutch text from these files, not from memory. Never edit these files.
- `shop-link-inventory.csv` — every link to natuurhout.shop (preserved verbatim; also the integration map for the later Shop phase).
- `media-uploads-referenced.txt` — all 863 unique wp-content/uploads URLs referenced in page HTML (mirror list).
- `robots.txt`, `sitemap.xml` — live copies at inventory date.
