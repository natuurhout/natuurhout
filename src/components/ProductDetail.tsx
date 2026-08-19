"use client";

import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPrice, type Product } from "@/lib/catalog";

/*
 * Product detail interaction — layout references the kastanjegjerde.no
 * product page: gallery + thumbnails left; title, option chips, price,
 * quantity and CTA right. Variant titles/prices are verbatim shop data.
 * There is no cart on this site: the CTA deep-links to the webshop with
 * the chosen variant preselected (rule 8 — the shop handles purchases).
 */

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

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        {img && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-white ring-1 ring-line">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          </div>
        )}
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {product.images.map((im, i) => (
              <button
                key={im.src}
                type="button"
                onClick={() => setImageIdx(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  i === imageIdx ? "ring-accent" : "ring-transparent hover:ring-brand/30"
                }`}
                aria-label={`Afbeelding ${i + 1}`}
              >
                <Image src={im.src} alt={im.alt} fill sizes="4rem" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy panel */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {product.title}
        </h1>

        {axes ? (
          <div className="mt-6 space-y-5">
            {[...axes.entries()].map(([name, values], axisIdx) => (
              <div key={name}>
                <p className="text-sm font-semibold">{name}</p>
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
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border-accent bg-accent text-white"
                            : soldOut
                              ? "border-brand/15 text-ink/40 line-through hover:border-brand/30"
                              : "border-brand/25 bg-white hover:border-accent hover:text-accent"
                        }`}
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
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    v.id === variant?.id
                      ? "border-accent bg-accent text-white"
                      : v.available
                        ? "border-brand/25 bg-white hover:border-accent hover:text-accent"
                        : "border-brand/15 text-ink/40 line-through hover:border-brand/30"
                  }`}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {variant && (
          <div className="mt-6">
            <p className="text-3xl font-semibold">
              {formatPrice(parseFloat(variant.price) * qty)}
            </p>
            <p className="text-sm text-ink/60">
              incl. btw
              {qty > 1 && ` — ${qty} × ${formatPrice(variant.price)}`}
              {" · "}
              {variant.available ? "Op voorraad" : "Uitverkocht"}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-white">
            <button
              type="button"
              className="px-3 py-2 text-lg leading-none text-ink/60 hover:text-accent"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="minder"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              className="px-3 py-2 text-lg leading-none text-ink/60 hover:text-accent"
              onClick={() => setQty((q) => q + 1)}
              aria-label="meer"
            >
              +
            </button>
          </span>
          <a
            href={shopHref}
            target="_blank"
            rel="noopener"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-deep sm:flex-none sm:px-10"
          >
            Bestel in de webshop
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm text-ink/70">
          {["Bestellen & betalen via natuurhout.shop", "Levering mogelijk", "Service op maat"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
