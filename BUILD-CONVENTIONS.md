# Build conventions

## Architecture

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3.
- Prefer Server Components. Client Components are limited to real interaction.
- Existing WordPress paths keep trailing slashes and their original canonical
  URLs. Never rename a live path for neatness.
- Purpose-built pages win over generated pages. The `[...slug]` route preserves
  the remaining WordPress surface from generated static data.

## Content and SEO

- Do not rewrite migrated Dutch copy while moving it. Fix objective errors in a
  separate, reviewable change.
- Preserve each page title, description, canonical, internal links, and heading
  hierarchy from the inventory unless an SEO change is explicitly approved.
- Use `next/image` with real dimensions and `sizes`.
- Keep `robots.ts` and layout metadata on `noindex` until the cutover checklist
  is complete.

## Visual system

- Self-hosted Satoshi is the only font family.
- Reuse Tailwind tokens from `tailwind.config.ts`: `ground`, `ink`, `brand`,
  `accent`, and `line`.
- Shared navigation and footer live in the root layout. Do not duplicate them in
  pages.

## Generated migration data

Run `npm run migration:extract` after replacing or refreshing snapshots. The
extractor intentionally strips WordPress scripts, forms, trackers, theme
wrappers, and inline styling, while preserving semantic content and media.

Do not edit:

- `migration/html-snapshot/**`
- `src/data/legacy-pages.json`

without going through the extraction process.
