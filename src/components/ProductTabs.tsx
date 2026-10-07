"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * Tabs under the buy box. Every panel is rendered into the HTML (inactive
 * ones are only `hidden`), so all product text stays in the page for search
 * engines and for anyone without JavaScript. Arrow keys move between tabs
 * (WAI-ARIA tabs pattern). A link to #productinfo opens the first tab.
 */

export type ProductTab = { id: string; label: string; content: ReactNode };

export default function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const open = () => {
      const id = window.location.hash.replace(/^#tab-/, "");
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [tabs]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const jump = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (!step && jump === null) return;
    event.preventDefault();
    const next = jump ?? (index + step + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Productinformatie"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-5 ${
                selected
                  ? "border-accent text-ink"
                  : "border-transparent text-ink/55 hover:border-brand/30 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          hidden={tab.id !== active}
          className="pt-6 outline-none"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
