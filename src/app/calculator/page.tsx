import type { Metadata } from "next";
import FenceCalculator, {
  type CalcFence,
  type CalcGate,
  type CalcPoleProduct,
} from "@/components/FenceCalculator";
import {
  fenceProducts,
  gateProducts,
  poleProducts,
  postsaverProduct,
} from "@/lib/calculator";

// New page (no live .be equivalent) — concept references
// kastanjegjerde.no/gjerdekalkulator per Xander. All prices are verbatim
// natuurhout.shop variant prices.
export const metadata: Metadata = {
  title: "Afsluitingscalculator | Natuurhout",
  description:
    "Bereken een richtprijs voor uw houten afsluiting: kies houtsoort, hoogte en lengte en krijg meteen een aanbevolen materiaallijst met actuele webshopprijzen.",
};

export default function CalculatorPage() {
  const fences: CalcFence[] = fenceProducts().map((f) => ({
    handle: f.product.handle,
    title: f.product.title,
    shopUrl: f.product.shopUrl,
    image: f.product.images[0]?.src,
    rolls: f.rolls.map((r) => ({
      variantId: r.variant.id,
      title: r.variant.title,
      price: parseFloat(r.variant.price),
      available: r.variant.available,
      height: r.height,
      spacing: r.spacing,
      rollLength: r.rollLength,
    })),
  }));

  const poles: CalcPoleProduct[] = poleProducts().map((p) => ({
    handle: p.product.handle,
    title: p.product.title,
    shopUrl: p.product.shopUrl,
    poles: p.poles.map((v) => ({
      variantId: v.variant.id,
      title: v.variant.title,
      price: parseFloat(v.variant.price),
      available: v.variant.available,
      length: v.length,
      diameter: v.diameter,
    })),
  }));

  const gates: CalcGate[] = gateProducts().map((g) => ({
    handle: g.handle,
    title: g.title,
    shopUrl: g.shopUrl,
    image: g.images[0]?.src,
    priceFrom: parseFloat(g.priceFrom ?? "0"),
    available: g.available,
  }));

  const ps = postsaverProduct();
  const postsavers = (ps?.variants ?? []).map((v) => ({
    variantId: v.id,
    title: v.title,
    price: parseFloat(v.price),
    available: v.available,
    shopUrl: ps ? `${ps.shopUrl}?variant=${v.id}` : "https://natuurhout.shop/",
  }));

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10">
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Calculator
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Bereken de richtprijs van uw afsluiting
        </h1>
        <p className="mt-5 leading-relaxed text-ink/70">
          Stel uw afsluiting samen met hekwerk, palen en eventueel een poort.
          U ziet meteen een richtprijs op basis van de actuele
          webshopprijzen — bestellen doet u nadien eenvoudig via de webshop.
        </p>
      </div>
      <div className="mt-10">
        <FenceCalculator
          fences={fences}
          poleProducts={poles}
          gates={gates}
          postsavers={postsavers}
        />
      </div>
    </div>
  );
}
