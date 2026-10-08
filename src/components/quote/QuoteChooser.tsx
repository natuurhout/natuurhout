"use client";

import { Calculator, MessageSquareText } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/*
 * Two ways to ask for a quote: the calculator (a fence with a richtprijs and
 * material list) or the free form (anything else). Both panels stay mounted,
 * so switching back and forth keeps what the customer already filled in.
 * #andere-vraag in the URL opens the free form directly.
 */

const OPTIONS = [
  {
    id: "calculator",
    hash: "#calculator",
    icon: Calculator,
    title: "Afsluiting berekenen",
    text: "Hekwerk, palen, poorten, vlechtschermen, Post & Rail of plantenbakken: stel samen, zie meteen een richtprijs en vraag uw offerte aan.",
  },
  {
    id: "vraag",
    hash: "#andere-vraag",
    icon: MessageSquareText,
    title: "Andere vraag of maatwerk",
    text: "Iets op maat, plaatsing, een combinatie van producten of gewoon een vraag? Beschrijf het en stuur eventueel foto's mee.",
  },
] as const;

type Choice = (typeof OPTIONS)[number]["id"];

export default function QuoteChooser({ calculator, form }: { calculator: ReactNode; form: ReactNode }) {
  const [choice, setChoice] = useState<Choice>("calculator");

  useEffect(() => {
    const fromHash = () => {
      const match = OPTIONS.find((o) => o.hash === window.location.hash);
      if (match) setChoice(match.id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function pick(id: Choice) {
    setChoice(id);
    const option = OPTIONS.find((o) => o.id === id)!;
    window.history.replaceState(null, "", option.hash);
  }

  return (
    <div>
      <div role="group" aria-label="Hoe wilt u uw offerte aanvragen?" className="grid gap-3 md:grid-cols-2">
        {OPTIONS.map(({ id, icon: Icon, title, text }) => {
          const active = choice === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              aria-controls={`offerte-${id}`}
              onClick={() => pick(id)}
              className={`flex items-start gap-4 rounded-card border-2 p-5 text-left transition-colors ${
                active ? "border-accent bg-white shadow-sm" : "border-line bg-white/60 hover:border-brand/40 hover:bg-white"
              }`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${active ? "bg-accent-deep text-white" : "bg-brand-soft text-ink/70"}`}>
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-ink/70">{text}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div id="offerte-calculator" hidden={choice !== "calculator"} className="mt-8">
        {calculator}
      </div>
      <div id="offerte-vraag" hidden={choice !== "vraag"} className="mt-8">
        {form}
      </div>
    </div>
  );
}
