import type { Product, ProductVariant } from "@/lib/catalog";
import { calculatorData } from "@/lib/calculator";
import { FITTED_SAVER, includedPostSaver, poleSize, postSaverFor } from "@/components/calculator/model";

/*
 * "Postsaver aangebracht door Natuurhout" as an order-only product (see
 * src/lib/order-only-products.ts): one variant per post the calculator offers
 * it on, priced exactly as the calculator does (postSaverFor), plus one per
 * gate-post diameter (includedPostSaver). Ready in about 3 days.
 */
export function fittedPostsavers(): Product | null {
  const data = calculatorData();
  const variants = new Map<number, ProductVariant>();
  for (const option of [...data.fencePoles, ...data.screenPoles, ...data.gatePoles]) {
    for (const pole of option.poles) {
      const saver = postSaverFor(data, option.kind, pole);
      if (saver.mounted === null || saver.mountedId === undefined || variants.has(saver.mountedId)) continue;
      variants.set(saver.mountedId, {
        id: saver.mountedId,
        title: `op ${option.title} ${pole.length} cm, ${poleSize(option.kind, pole.diameter)}`,
        price: saver.mounted.toFixed(2),
        compare_at: null,
        available: true,
      });
    }
  }
  for (const key of Object.keys(data.loosePostsavers?.byKey ?? {})) {
    const saver = includedPostSaver(data, key);
    if (saver.mounted === null || saver.mountedId === undefined || variants.has(saver.mountedId)) continue;
    variants.set(saver.mountedId, { id: saver.mountedId, title: `op poortpaal ø${key}`, price: saver.mounted.toFixed(2), compare_at: null, available: true });
  }
  if (!variants.size) return null;
  const prices = [...variants.values()].map((v) => parseFloat(v.price));
  return {
    handle: FITTED_SAVER.handle,
    title: FITTED_SAVER.title,
    bodyHtml: "",
    options: ["Paal"],
    images: [],
    variants: [...variants.values()],
    priceFrom: Math.min(...prices).toFixed(2),
    priceTo: Math.max(...prices).toFixed(2),
    available: true,
    tags: [],
    shopUrl: "/project/postsaver-voor-palen/",
    publishedAt: null,
  };
}
