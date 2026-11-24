import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Clock, HelpCircle, Mail, MapPin, Navigation, Phone, ShoppingCart, Smartphone, Truck } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import JsonLd from "@/components/JsonLd";
import OpeningStatus from "@/components/OpeningStatus";
import { WhatsAppIcon } from "@/components/WhatsApp";
import { ADDRESS, EMAIL, MOBILE, PHONE, WHATSAPP } from "@/lib/contact";
import { getLegacyPageByPath } from "@/lib/legacy";
import { HOURS_TEXT } from "@/lib/opening-hours";

/*
 * Contact page, rebuilt (handbuilt-routes.json, Xander, Nov 2026): the
 * WordPress page was a holiday notice image above a form that only worked
 * inside WordPress. Title, description, canonical, structured data and the
 * h1 text stay as the SEO baseline froze them; the page now leads with the
 * ways to reach Natuurhout, a working form (ContactForm, /api/offerte/),
 * the address and opening hours.
 */
const page = getLegacyPageByPath("/contact/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

const TEAM = ["/fotos/team/team-1.jpg", "/fotos/team/team-2.jpg", "/fotos/team/team-3.jpg", "/fotos/team/team-4.jpg"];

const channels = [
  { icon: Phone, label: "Bel ons", value: PHONE.label, href: PHONE.href, note: "Tijdens de openingsuren" },
  { icon: Smartphone, label: "Gsm", value: MOBILE.label, href: MOBILE.href, note: "Ook voor een snelle vraag" },
  { icon: WhatsAppIcon, label: "WhatsApp", value: WHATSAPP.label, href: WHATSAPP.href, note: "Stuur gerust foto's van uw tuin", external: true },
  { icon: Mail, label: "Mail", value: EMAIL.label, href: EMAIL.href, note: "Wij antwoorden zo snel mogelijk" },
];

const shortcuts = [
  { icon: Calculator, title: "Richtprijs voor uw afsluiting", text: "Hekwerk, palen en poort in een paar stappen.", href: "/calculator/" },
  { icon: ShoppingCart, title: "Meteen bestellen", text: "Alle producten en prijzen in de shop.", href: "/shop/" },
  { icon: HelpCircle, title: "Veelgestelde vragen", text: "Levering, afhalen, betalen en plaatsen.", href: "/veelgesteldevragen/" },
];

export default function ContactPage() {
  if (!page) throw new Error("The WordPress /contact/ snapshot is missing.");
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      {page.structuredData && <JsonLd data={page.structuredData} />}

      <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Contact
          </p>
          {/* The h1 text is frozen by the SEO baseline: "Contact | info@natuurhout.be". */}
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Contact <span className="sr-only">|</span>{" "}
            <span className="mt-1 block text-xl font-semibold text-ink/55 sm:text-2xl">{EMAIL.label}</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/75">
            Voor al uw vragen over kastanjehout, het plaatsen van hekwerk, levering van de materialen of iets anders kunt u
            bij ons terecht. Wij helpen u graag verder.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-card border border-line bg-white px-5 py-4">
          <div className="flex -space-x-3">
            {TEAM.map((src) => (
              <Image key={src} src={src} alt="" width={56} height={56} className="h-12 w-12 rounded-full object-cover ring-2 ring-white" />
            ))}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-ink">Familiebedrijf uit Zele</p>
            <p className="text-ink/60">U spreekt ons rechtstreeks</p>
            <OpeningStatus className="mt-1" />
          </div>
        </div>
      </header>

      {/* Every way to reach us, one tap away */}
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map(({ icon: Icon, label, value, href, note, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex h-full items-start gap-4 rounded-card border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-ink/10"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${label === "WhatsApp" ? "bg-[#25d366]/15 text-[#128c43]" : "bg-accent/10 text-accent-deep"}`}>
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">{label}</span>
                <span className="mt-0.5 block truncate font-semibold text-ink group-hover:text-accent-deep">{value}</span>
                <span className="mt-0.5 block text-sm text-ink/60">{note}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="vraag">
          {/* The snapshot's form heading, kept. */}
          <h2 id="vraag" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Stel hier uw vraag of vraag een offerte aan
          </h2>
          <p className="mt-2 text-ink/65">
            Schrijf kort uw vraag; we antwoorden per mail of bellen u terug. Voor een prijs op maat gebruikt u best het{" "}
            <Link href="/offerte-aanvragen/" className="font-semibold text-accent-deep underline underline-offset-2 hover:text-ink">
              offerteformulier
            </Link>
            .
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <div className="relative aspect-[16/9] bg-brand-soft">
              <Image
                src="/fotos/kastanje-hekwerk-natuurhout.jpg"
                alt="Kastanje hekwerk van Natuurhout, met het Natuurhout-bordje"
                fill
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <p className="flex items-center gap-2 font-display text-lg font-bold">
                <MapPin aria-hidden className="h-5 w-5 text-accent" /> Afhalen in Zele
              </p>
              <address className="mt-2 not-italic leading-7 text-ink/80">
                Natuurhout
                <br />
                {ADDRESS.street}
                <br />
                {ADDRESS.city}, {ADDRESS.country}
              </address>
              <a
                href={ADDRESS.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                <Navigation aria-hidden className="h-4 w-4" /> Routebeschrijving
              </a>
              <p className="mt-4 text-sm leading-6 text-ink/65">
                Bel of mail even vooraf, dan staat uw bestelling klaar. Wij helpen u graag met inladen.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-line bg-white p-5">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <Clock aria-hidden className="h-5 w-5 text-accent" /> Openingsuren
            </p>
            <dl className="mt-3 divide-y divide-line text-[15px]">
              {HOURS_TEXT.map((row) => (
                <div key={row.days} className="flex justify-between gap-4 py-2">
                  <dt className="text-ink/70">{row.days}</dt>
                  <dd className="font-semibold text-ink">{row.hours}</dd>
                </div>
              ))}
            </dl>
            <OpeningStatus className="mt-3" />
          </div>

          <div className="flex gap-3 rounded-card bg-brand-dark p-5 text-sm leading-6 text-white/80">
            <Truck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent-bright" />
            <p>
              <strong className="text-white">Liever geleverd?</strong> We leveren zelf in heel België; levering in Nederland kan na overleg. Wat op
              voorraad is, staat binnen de week bij u.
            </p>
          </div>
        </aside>
      </div>

      <section aria-label="Snel verder" className="mt-14 grid gap-3 border-t border-line pt-10 md:grid-cols-3">
        {shortcuts.map(({ icon: Icon, title, text, href }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-card border border-line bg-white p-5 transition-colors hover:border-accent/40"
          >
            <Icon aria-hidden className="h-6 w-6 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink group-hover:text-accent-deep">{title}</span>
              <span className="block text-sm text-ink/60">{text}</span>
            </span>
            <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink/40 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-deep" />
          </Link>
        ))}
      </section>
    </div>
  );
}
