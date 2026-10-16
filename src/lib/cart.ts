"use client";

import { useSyncExternalStore } from "react";

/*
 * The winkelmandje: products chosen on several price lists, sent together as
 * one order (OrderRequestForm on /winkelmandje/). There is no online checkout,
 * so the basket only lives in this browser (localStorage) until it is sent;
 * when storage is unavailable it still works for the current page view.
 */

export type CartLine = {
  /** Variant id (negative for website-only and request-only products). */
  id: number;
  handle: string;
  product: string;
  /** The variant as the price list writes it, e.g. "120cm · 4.5/5cm · rol van 5 m". */
  label: string;
  unit: number;
  qty: number;
  available: boolean;
};

const KEY = "natuurhout-winkelmandje-v1";
const EVENT = "natuurhout-winkelmandje";
const EMPTY: CartLine[] = [];

let cache: CartLine[] | null = null;

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (l): l is CartLine =>
        l && typeof l.id === "number" && typeof l.label === "string" && typeof l.unit === "number" && typeof l.qty === "number" && l.qty > 0,
    );
  } catch {
    return EMPTY;
  }
}

function read(): CartLine[] {
  if (cache === null) cache = load();
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode or storage blocked: the basket lasts for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const fromOtherTab = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", fromOtherTab);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", fromOtherTab);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Adds lines; a variant already in the basket gets the extra quantity. */
export function addToCart(lines: CartLine[]) {
  const next = [...read()];
  for (const line of lines) {
    const i = next.findIndex((l) => l.id === line.id);
    if (i >= 0) next[i] = { ...next[i], ...line, qty: next[i].qty + line.qty };
    else next.push(line);
  }
  write(next);
}

export function setCartQty(id: number, qty: number) {
  write(qty > 0 ? read().map((l) => (l.id === id ? { ...l, qty } : l)) : read().filter((l) => l.id !== id));
}

export function clearCart() {
  write(EMPTY);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
