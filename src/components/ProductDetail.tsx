"use client";

import Image from "next/image";
import { ArrowUpRight, Leaf, Minus, Plus, ShieldCheck, Store, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  compareAtPrice,
  discountPercent,
  formatPrice,
  type Product,
} from "@/lib/catalog";
import { productLead } from "@/lib/seo";

/*
 * Product detail interaction — layout references the kastanjegjerde.no
 * product page: gallery + thumbnails left; title, option chips, price,
 * quantity and CTA right. Variant titles/prices are verbatim shop data.
 * There is no cart on this site: the CTA deep-links to the webshop with
 * the chosen variant preselected (rule 8 — the shop handles purchases).
 *
 * The media frame is square because 103 of the catalogue's ~150 shop photos
 * are 1:1; a landscape frame letterboxed most of them into empty space.
 * The buy panel sticks on desktop so the column stays occupied while the
 * taller gallery scrolls past it.
 */

const assurances = [
  { icon: Truck, label: "Levering mogelijk" },
  { icon: Store, label: "Afhalen in Zele" },
  { icon: ShieldCheck, label: "+15 jaar ervaring" },
  { icon: Leaf, label: "Duurzaam hout" },
];

function splitTitle(title: string): string[] {
  return title.split("/").map((s) => s.trim());
}

export default function ProductDetail({ product }: { product: Product }) {
  const [imageIdx, setImageIdx] = useState(0);
  const firstAvailable =
    product.variants.find((v) => v.available) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const variant =
    product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  const [qty, setQty] = useState(1);

  // Group variants into option axes when the product has 2 options
  // (e.g. Hoogte × Latafstand). Chips per axis, kastanjegjerde-style.
  const axes = useMemo(() => {
    if (product.options.length < 2) return null;
    const a = new Map<string, string[]>();
    for (const v of product.variants) {
      const parts = splitTitle(v.title);
      if (parts.length < 2) return null;
    }
    const first = [...new Set(product.variants.map((v) => splitTitle(v.title)[0]))];
    const second = [...new Set(product.variants.map((v) => splitTitle(v.title).slice(1).join(" / ")))];
    a.set(product.options[0], first);
    a.set(product.options[1], second);
    return a;
  }, [product]);

  const selParts = variant ? splitTitle(variant.title) : [];
  const selFirst = selParts[0];
  const selSecond = selParts.slice(1).join(" / ");

  function findVariant(first: string, second: string) {
    return product.variants.find((v) => {
      const p = splitTitle(v.title);
      return p[0] === first && p.slice(1).join(" / ") === second;
    });
  }

  function pickFirst(first: string) {
    const v =
      findVariant(first, selSecond) ??
      product.variants.find((x) => splitTitle(x.title)[0] === first && x.available) ??
      product.variants.find((x) => splitTitle(x.title)[0] === first);
    if (v) setVariantId(v.id);
  }

  function pickSecond(second: string) {
    const v = findVariant(selFirst, second);
    if (v) setVariantId(v.id);
  }

  const shopHref = variant
    ? `${product.shopUrl}?variant=${variant.id}`
    : product.shopUrl;
  const img = product.images[imageIdx] ?? product.images[0];
  const wasPrice = variant ? compareAtPrice(variant) : null;
  const saving = variant ? discountPercent(variant) : null;
  const unitPrice = variant ? parseFloat(variant.price) : 0;

  // A single "Default Title" variant is Shopify's placeholder for a product
  // without options — there is nothing for the customer to choose.
  const hasChoice =
    product.variants.length > 1 || (variant && variant.title !== "Default Title");

  const chipClass = (state: "active" | "available" | "soldOut") =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      state === "active"
        ? "border-accent bg-accent text-white"
        : state === "soldOut"
          ? "border-brand/15 text-ink/40 line-through hover:border-brand/30"
          : "border-brand/25 bg-white hover:border-accent hover:text-accent"
    }`;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start xl:gap-12">
      {/* Gallery */}
      <div className="lg:sticky lg:top-6">
        {img && (
          <div className="relative aspect-square overflow-hidden rounded-card bg-brand-soft/40 ring-1 ring-line">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              priority
            />
            {saving !== null && (
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                −{saving}%
              </span>
            )}
          </div>
        )}
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
            {product.images.map((im, i) => (
              <button
                key={im.src}
                type="button"
                onClick={() => setImageIdx(i)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-card ring-2 transition ${
                  i === imageIdx ? "ring-accent" : "ring-line hover:ring-brand/40"
                }`}
                aria-label={`Afbeelding ${i + 1}`}
                aria-current={i === imageIdx}
              >
                <Image src={im.src} alt={im.alt} fill sizes="5rem" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy panel */}
      <div className="lg:rounded-card lg:border lg:border-line lg:bg-white lg:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {product.title}
        </h1>
        <p className="mt-3 leading-7 text-ink/75">{productLead(product)}</p>

        {/* Price */}
        {variant && (
          <div className="mt-6 border-y border-line py-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-semibold tracking-tight">
                {formatPrice(unitPrice * qty)}
              </span>
              {wasPrice !== null && (
                <span className="text-lg text-ink/45 line-through">
                  {formatPrice(wasPrice * qty)}
                </span>
              )}
              {saving !== null && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent-deep">
                  U bespaart {formatPrice((wasPrice ?? 0) * qty - unitPrice * qty)}
                </span>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/60">
              <span>incl. btw</span>
              {qty > 1 && <span>· {qty} × {formatPrice(variant.price)}</span>}
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-ink/75">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    variant.available ? "bg-emerald-600" : "bg-ink/30"
                  }`}
                />
                {variant.available ? "Op voorraad" : "Uitverkocht"}
              </span>
            </p>
          </div>
        )}

        {/* Variants */}
        {axes ? (
          <div className="mt-6 space-y-5">
            {[...axes.entries()].map(([name, values], axisIdx) => (
              <div key={name}>
                <p className="text-sm font-semibold">
                  {name}
                  <span className="ml-2 font-normal text-ink/55">
                    {axisIdx === 0 ? selFirst : selSecond}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {values.map((val) => {
                    const cand =
                      axisIdx === 0 ? findVariant(val, selSecond) : findVariant(selFirst, val);
                    const active = axisIdx === 0 ? val === selFirst : val === selSecond;
                    const exists = axisIdx === 0
                      ? product.variants.some((v) => splitTitle(v.title)[0] === val)
                      : Boolean(cand);
                    const soldOut = cand ? !cand.available : false;
                    if (!exists) return null;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => (axisIdx === 0 ? pickFirst(val) : pickSecond(val))}
                        aria-pressed={active}
                        className={chipClass(active ? "active" : soldOut ? "soldOut" : "available")}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : product.variants.length > 1 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold">
              {product.options[0] ?? "Uitvoering"}
              <span className="ml-2 font-normal text-ink/55">{variant?.title}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={v.id === variant?.id}
                  className={chipClass(
                    v.id === variant?.id ? "active" : v.available ? "available" : "soldOut",
                  )}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Quantity + CTA */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="inline-flex items-center self-start rounded-full border border-brand/25 bg-white sm:self-auto">
            <button
              type="button"
              className="rounded-l-full px-3.5 py-3 text-ink/60 transition-colors hover:text-accent disabled:text-ink/25"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Aantal verlagen"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              className="rounded-r-full px-3.5 py-3 text-ink/60 transition-colors hover:text-accent"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Aantal verhogen"
            >
              <Plus className="h-4 w-4" />
            </button>
          </span>
          <a
            href={shopHref}
            target="_blank"
            rel="noopener"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            Bestel in de webshop
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <p className="mt-2.5 text-xs text-ink/55">
          {hasChoice
            ? "Uw keuze staat klaar op natuurhout.shop — daar rondt u de bestelling en betaling af."
            : "Bestellen en betalen verloopt via natuurhout.shop."}
        </p>

        {/* Assurances */}
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-5 text-sm text-ink/75">
          {assurances.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-accent" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
