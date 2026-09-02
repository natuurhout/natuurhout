import type { Metadata } from "next";
import { Mail, MapPin, Phone, Smartphone } from "lucide-react";
import EmailRequestForm from "@/components/EmailRequestForm";

export const metadata: Metadata = {
  title: "Contact | Natuurhout",
  alternates: { canonical: "https://www.natuurhout.be/contact/" },
};

export default function ContactPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Wij helpen u graag verder</h1>
          <p className="mt-5 max-w-xl leading-7 text-ink/70">Neem contact op voor advies over houtsoorten, plaatsing, levering of een project op maat.</p>
          <ul className="mt-8 space-y-4 text-sm text-ink/75">
            <li className="flex gap-3"><MapPin className="h-5 w-5 text-accent" />Adolf Van Der Moerenstraat 39, 9240 Zele - België</li>
            <li className="flex gap-3"><Phone className="h-5 w-5 text-accent" /><a href="tel:+3252558858">+32 5 255 88 58</a></li>
            <li className="flex gap-3"><Smartphone className="h-5 w-5 text-accent" /><a href="tel:+32473740926">+32 473 74 09 26</a></li>
            <li className="flex gap-3"><Mail className="h-5 w-5 text-accent" /><a href="mailto:info@natuurhout.be">info@natuurhout.be</a></li>
          </ul>
        </div>
        <EmailRequestForm kind="contact" />
      </div>
    </div>
  );
}
