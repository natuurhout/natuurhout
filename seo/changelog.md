# SEO-changelog natuurhout.be

## Batch 1 — 24 november 2026 (op de testbranch, nog niet live)

Beslist door de eigenaar op 24/11: optie A, levering in heel België (Nederland op aanvraag), plaatsing zonder regio, hazelaar ±10 jaar, natuurhout.shop blijft online.

### 1. Eén hoofdpagina per product (optie A, kannibalisatie)

| Wat | Waarom | URL's |
|---|---|---|
| De 19 /shop/-pagina's met een /project/-tegenhanger krijgen een canonical naar die /project/-pagina | Google bundelt de signalen op één pagina | zie `src/lib/canonical-pages.ts` (19 paren) |
| Die 19 /shop/-URL's gaan uit de sitemap (139 → 120 URL's) | De sitemap toont enkel canonieke pagina's | /sitemap.xml |
| Interne links (productkaarten, categorieën, zoekfunctie, winkelmandje, links in producttekst) gaan naar de /project/-pagina | Interne links wijzen naar de canonieke URL | sitebreed |
| Het Product-schema (offer per uitvoering, prijs incl. btw, voorraad) staat nu op de /project/-pagina; de /shop/-pagina toont het niet meer | Schema op de canonieke pagina; geen dubbele Product-entiteiten | 17 /project/-pagina's |
| Niet op voorraad = `BackOrder` in plaats van `OutOfStock` | Het product kan wel besteld worden (op bestelling/aanvraag) | alle productpagina's |

Blijft: de /shop/-pagina's zelf. Ze geven nog altijd 200, dus oude links en winkelmandjes blijven werken. Er zijn geen redirects.

### 2. Consistente feiten

| Voor | Na | Waar |
|---|---|---|
| "Levering in heel Vlaanderen" (meta home, poorten, landelijke afsluiting) | "Levering in heel België" | meta description van /, /houten-tuinpoorten/, /landelijke-afsluiting/ |
| "heel Vlaanderen, de rest van België en delen van Nederland" | "heel België. Levering in Nederland is ook mogelijk: neem dan even contact met ons op." | FAQ's op /, /houten-tuinpoorten/, /landelijke-afsluiting/, /producten/; contact; calculator; voordelenblok home |
| "Geleverd en geplaatst in heel Vlaanderen" | "Geleverd in heel België, en geplaatst als u dat wilt" | / |
| Kopjes "Levering en plaatsing in heel Vlaanderen", "Tuinafsluitingen geplaatst in heel Vlaanderen", "Houten tuinpoorten in heel Vlaanderen" | "Levering in heel België en plaatsing", "Al 15 jaar tuinafsluitingen in Vlaanderen", "Al 15 jaar houten tuinpoorten in Vlaanderen" | /landelijke-afsluiting/, /houten-tuinpoorten/ |
| FAQ-vraag "Leveren jullie in heel Vlaanderen?" | "Leveren jullie in heel België?" | / (ook in FAQPage-schema) |
| LocalBusiness `areaServed`: Vlaanderen + België | België | / (schema) |
| Hazelaar "8 tot 15 jaar" | "ongeveer 10 jaar" | /, /houten-tuinpoorten/, /landelijke-afsluiting/, /veelgesteldevragen/, /kastanje-hazelaar-of-robinia-hekwerk-wat-is-het-verschil/ (oude teksten via `FACT_RULES` in `src/lib/renames.mjs`) |

Goedgekeurde wijzigingen van de bevroren WordPress-pagina's staan in `migration/handbuilt-routes.json` en `src/lib/renames.mjs`.

### Niet in deze batch (wacht op akkoord)
De andere punten uit de actielijst van de audit: tracking-events, Shopify-foto's verhuizen, afbeeldingen verkleinen, overige schema-fixes, navigatie-H2's, 404-pagina, redirects, wees-pagina's, titles/meta's en Open Graph.

## Batch 2 (24/11/2026): meten, snelheid, schema, techniek

### 1. Tracking (enkel na toestemming via de cookiebanner)

| Event | Wanneer | Waar |
|---|---|---|
| `click_phone`, `click_email`, `click_whatsapp` (+ Meta `Contact`) | klik op een tel:-, mailto:- of WhatsApp-link, waar ook op de site | `src/components/ClickTracking.tsx` |
| `calculator_complete` (waarde in EUR) | de calculator bereikt het overzicht met een prijs (1x per bezoek) | `src/components/FenceCalculator.tsx` |
| `purchase` (transactie-id, waarde, betaalwijze, producten; + Meta `Purchase`) | bevestigingspagina na /afrekenen/ (online betaald of overschrijving), 1x per bestelling en browser; testbestellingen tellen niet | `src/components/checkout/CheckoutResult.tsx` |

Bestaand: `generate_lead` bij een verstuurde offerte/bestelaanvraag. In Google Ads kunnen `purchase`, `generate_lead` en `click_phone` als conversie worden ingesteld (in GTM/GA4, niet in de code).

### 2. Lichtere foto's

| Wat | Effect |
|---|---|
| Eigen foto's (`/fotos/…`, `/wp-content/uploads/…`) via `next/image` worden WebP in breedtes 64–1920 px (`src/lib/image-loader.ts`, `scripts/build-images.mjs` na de build) met `srcset`/`sizes` | bv. heldfoto home op gsm 153 kB → 43 kB; een oude WordPress-foto 1,2 MB → 240 kB |
| Shopify-foto's krijgen de breedte-parameter van Shopify | geen volle formaten meer voor kleine kaartjes |
| Ontbreekt een WebP-kopie, dan geeft de Worker het origineel | nooit een kapotte foto |
| Heldfoto home: preload met dezelfde WebP-srcset; `priority` (verouderd in Next 16) → `preload` | snellere LCP |
| WebP-kopieën worden per inhoud bewaard (cache in de deploy) | een deploy codeert enkel nieuwe foto's |

De foto's in de bevroren WordPress-tekst zelf (gewone `<img>` in de snapshot) blijven ongewijzigd.

### 3. Schema

| Wat | Waar |
|---|---|
| Relatieve URL's in het oude WordPress-schema (logo, afbeeldingen) → absoluut | alle oude pagina's (`src/lib/legacy.ts`) |
| `Person`-nodes (auteur) weg, behalve op blogartikels | oude pagina's |
| WebPage-naam/beschrijving = de goedgekeurde nieuwe title/description | herbouwde pagina's |
| `geo` (werf Zele) in LocalBusiness | / |
| FAQPage, woord voor woord de 6 vragen op de pagina | /veelgesteldevragen/ |
| BreadcrumbList (zelfde kruimelpad als op de pagina) | /assortiment/*/, /realisaties/*/, /calculator/ |

Nog open: `sameAs` met het Google-bedrijfsprofiel (link nodig van de eigenaar).

### 4. Techniek

| Wat | Waarom |
|---|---|
| Kopjes in het productmenu zijn geen `<h2>` meer | elke pagina had ~8 dezelfde H2's vóór de inhoud |
| Nederlandse 404-pagina met links naar productgroepen, calculator en contact (noindex) | de standaard Next-404 was Engels |
| Redirects in één stap (ook zonder slash) | voorheen 2 hops: eerst slash, dan doel |
| /kastanje-palen en /lariks-schaaldelen-kopen-vlaanderen → hun productpagina i.p.v. de homepage | zie `seo/redirects.csv` |
