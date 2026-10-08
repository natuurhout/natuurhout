import { Clock, Mail, MapPin, Phone, Smartphone } from "lucide-react";
import OpeningStatus from "@/components/OpeningStatus";
import { ADDRESS, EMAIL, MOBILE, PHONE, WHATSAPP } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/WhatsApp";
import { HOURS_TEXT } from "@/lib/opening-hours";

/*
 * Address, phone numbers and opening hours for the contact page. The header
 * only shows a one-line opening status, so the full details live here (and
 * in the footer).
 */
export default function ContactDetails() {
  const card = "rounded-card border border-line bg-white p-6";
  const title = "flex items-center gap-2 font-display text-lg font-bold text-ink";
  const link = "font-semibold text-ink hover:text-accent-deep";

  return (
    <section
      aria-labelledby="contactgegevens"
      className="mx-auto mb-14 w-[calc(100%-2rem)] max-w-[1160px] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-5rem)]"
    >
      <h2 id="contactgegevens" className="font-display text-2xl font-bold text-ink">
        Contactgegevens
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className={card}>
          <p className={title}>
            <MapPin aria-hidden className="h-5 w-5 text-accent" /> Adres
          </p>
          <address className="mt-3 text-[15px] not-italic leading-7 text-ink/80">
            Natuurhout
            <br />
            {ADDRESS.street}
            <br />
            {ADDRESS.city}, {ADDRESS.country}
          </address>
          <a href={ADDRESS.maps} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-accent-deep hover:text-ink">
            Routebeschrijving →
          </a>
        </div>

        <div className={card}>
          <p className={title}>
            <Phone aria-hidden className="h-5 w-5 text-accent" /> Bel, mail of WhatsApp
          </p>
          <ul className="mt-3 space-y-2 text-[15px] text-ink/80">
            <li className="flex items-center gap-2">
              <Phone aria-hidden className="h-4 w-4 text-ink/50" /> Tel:{" "}
              <a href={PHONE.href} className={link}>{PHONE.label}</a>
            </li>
            <li className="flex items-center gap-2">
              <Smartphone aria-hidden className="h-4 w-4 text-ink/50" /> Gsm:{" "}
              <a href={MOBILE.href} className={link}>{MOBILE.label}</a>
            </li>
            <li className="flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4 text-ink/50" /> WhatsApp:{" "}
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className={link}>{WHATSAPP.label}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail aria-hidden className="h-4 w-4 text-ink/50" />
              <a href={EMAIL.href} className={link}>{EMAIL.label}</a>
            </li>
          </ul>
        </div>

        <div className={card}>
          <p className={title}>
            <Clock aria-hidden className="h-5 w-5 text-accent" /> Openingsuren
          </p>
          <dl className="mt-3 space-y-1.5 text-[15px]">
            {HOURS_TEXT.map((row) => (
              <div key={row.days} className="flex justify-between gap-4">
                <dt className="text-ink/70">{row.days}</dt>
                <dd className="font-semibold text-ink">{row.hours}</dd>
              </div>
            ))}
          </dl>
          <OpeningStatus className="mt-4" />
        </div>
      </div>
    </section>
  );
}
