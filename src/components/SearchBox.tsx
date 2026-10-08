"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import type { SearchItem, SearchKind } from "@/lib/search";

const MAX_RESULTS = 8;
const KIND_WEIGHT: Record<SearchKind, number> = { Productgroep: 40, Webshop: 30, Pagina: 20, Info: 10, Realisatie: 0 };

/** Lower case, no accents, "&" as "en": "Ideeën & tips" matches "ideeen en tips". */
function normalize(value: string) {
  return value
    .toLocaleLowerCase("nl")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9,.]+/g, " ")
    .trim();
}

type Prepared = SearchItem & { nTitle: string; nAll: string };

function rank(items: Prepared[], query: string): Prepared[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(" ");
  return items
    .filter((item) => words.every((word) => item.nAll.includes(word)))
    .map((item) => {
      let score = KIND_WEIGHT[item.kind];
      if (item.nTitle.startsWith(q)) score += 100;
      else if (item.nTitle.includes(q)) score += 60;
      for (const word of words) if (` ${item.nTitle}`.includes(` ${word}`)) score += 15;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length)
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}

/*
 * Header search: suggestions while typing, as an ARIA combobox (arrow keys,
 * Enter, Escape). The index is small and shipped with the page, so it works
 * instantly without a server round trip.
 */
export default function SearchBox({
  items,
  className = "",
  autoFocus = false,
  onNavigate,
}: {
  items: SearchItem[];
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-resultaten`;
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const prepared = useMemo<Prepared[]>(
    () => items.map((item) => ({ ...item, nTitle: normalize(item.title), nAll: normalize(`${item.title} ${item.keywords ?? ""} ${item.kind}`) })),
    [items],
  );
  const results = useMemo(() => rank(prepared, query), [prepared, query]);
  const showList = open && query.trim().length > 0;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(item: SearchItem | undefined) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(item.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (results.length) setActive((i) => (i + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === "Escape") {
      // Leave the page-level Escape handlers (mobile menu) alone when there
      // is something to close here.
      if (showList || query) {
        event.stopPropagation();
        setOpen(false);
        setQuery("");
      }
    }
  }

  return (
    <div ref={rootRef} role="search" className={`relative ${className}`}>
      <label htmlFor={`${id}-veld`} className="sr-only">
        Zoeken op de website
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
      <input
        ref={inputRef}
        id={`${id}-veld`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${id}-r${active}` : undefined}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Zoek een product, bv. robinia poort"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full border border-line bg-ground pl-9 pr-9 text-sm text-ink placeholder:text-ink/45 focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Zoekveld leegmaken"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/45 hover:text-ink"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      )}

      <div
        hidden={!showList}
        className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white text-left shadow-xl shadow-ink/15"
      >
        <ul id={listId} role="listbox" aria-label="Zoekresultaten" className="max-h-[min(70vh,28rem)] overflow-y-auto py-1.5">
          {results.map((item, index) => (
            <li
              key={item.href}
              id={`${id}-r${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                go(item);
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${index === active ? "bg-ground" : ""}`}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-brand-soft/60">
                {item.image ? (
                  <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <ArrowRight aria-hidden className="absolute inset-0 m-auto h-4 w-4 text-accent-deep" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                <span className="block text-xs text-ink/55">
                  {item.kind}
                  {item.price ? ` · ${item.price}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {results.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink/65">
            Niets gevonden voor “{query.trim()}”. Bel ons of stuur een WhatsApp, we helpen u graag verder.
          </p>
        )}
      </div>
    </div>
  );
}
