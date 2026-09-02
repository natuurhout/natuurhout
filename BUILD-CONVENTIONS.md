# Build conventions

## Architecture

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3.
- Prefer Server Components. Client Components are limited to real interaction.
- Existing WordPress paths keep trailing slashes and their original canonical
  URLs. Never rename a live path for neatness.
- Purpose-built pages win over generated pages. The `[...slug]` route preserves
  the remaining WordPress surface from generated static data.

## Content and SEO

- Governing decision: take the WordPress site over 1:1 first to protect existing
  rankings, then improve. Preserve the live site's content and information
  structure; do not preserve its visual design pixel for pixel.
- Do not rewrite migrated Dutch copy while moving it. Fix objective errors in a
  separate, reviewable change.
- Preserve each page title, description, canonical, internal links, and heading
  hierarchy from the inventory unless an SEO change is explicitly approved.
- New interface and shop images use `next/image`. Preserved WordPress bodies use
  their original plain `<img>` markup so content order remains deterministic.
- Keep `robots.ts` and layout metadata on `noindex` until the cutover checklist
  is complete.
- New tools and commerce are additive under new paths such as `/shop/` and
  `/calculator/`; they never replace an existing WordPress page.

## Visual system

- Self-hosted Satoshi is the only font family.
- Reuse Tailwind tokens from `tailwind.config.ts`: `ground`, `ink`, `brand`,
  `accent`, and `line`.
- Shared navigation and footer live in the root layout. Do not duplicate them in
  pages.

## Generated migration data

Run `npm run migration:extract` after replacing or refreshing snapshots. The
extractor strips scripts, trackers and event handlers while preserving the
ordered content tree, theme wrappers, heading levels, tables, galleries, forms,
links, inline layout styling, and media paths.

Then run `npm run migration:assets` and `npm run migration:assets:prune`.
WordPress uploads are stored below `public/wp-content/uploads/` at their original
paths. Never hotlink the old host.

Do not edit:

- `migration/html-snapshot/**`
- `src/data/legacy-pages.json`

without going through the extraction process.

## Parity definition of done

After `npm run build`, `npm run migration:audit:built` must pass. It checks the
emitted HTML rather than source files and proves, per legacy URL:

- the full heading sequence is unchanged;
- visible text is unchanged;
- link targets and order are unchanged;
- image sources and order are unchanged;
- every rendered WordPress asset exists locally;
- zero WordPress media hotlinks remain.
