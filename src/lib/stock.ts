"use client";

import { useEffect, useState } from "react";

/*
 * Counted stock per variant id, live from the Worker (GET /api/afrekenen/voorraad/,
 * worker/shop/checkout.ts → stockLevels). Variants whose stock is not counted are
 * missing. The price list and winkelmandje say what is in nabestelling above it
 * (src/lib/order-limits.ts → backorderNote).
 */
export function useStock(ids: number[]): Record<number, number> {
  const key = [...new Set(ids)].sort((a, b) => a - b).join(",");
  const [stock, setStock] = useState<Record<number, number>>({});
  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch(`/api/afrekenen/voorraad/?ids=${key}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stock?: Record<string, number> } | null) => {
        if (live && d?.stock) setStock(Object.fromEntries(Object.entries(d.stock).map(([k, v]) => [Number(k), v])));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return stock;
}
