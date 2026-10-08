/*
 * Natuurhout's contact details in one place, for the header, the contact
 * page and the product pages. The landline is a Zele (052) number: written
 * the Belgian way, "052 55 88 58"; the tel: link carries the international
 * form. The footer keeps its verbatim WordPress strings apart from this format.
 */

export const PHONE = { label: "052 55 88 58", href: "tel:+3252558858" };
export const MOBILE = { label: "+32 473 74 09 26", href: "tel:+32473740926" };
export const EMAIL = { label: "info@natuurhout.be", href: "mailto:info@natuurhout.be" };

export const ADDRESS = {
  street: "A. Van Der Moerenstraat 39",
  city: "9240 Zele",
  country: "België",
  maps: "https://maps.google.com/?q=A.+Van+Der+Moerenstraat+39,+9240+Zele",
};

export const SHOP_URL = "https://natuurhout.shop";

export const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/natuurhout/" },
  { label: "Instagram", href: "https://www.instagram.com/natuurhout/" },
];

/** WhatsApp runs on the landline (052 55 88 58). */
export const WHATSAPP = {
  label: "052 55 88 58",
  href: `https://wa.me/3252558858?text=${encodeURIComponent("Hallo Natuurhout, ")}`,
};

/*
 * Google Business profile score, copied by hand from Google (no API key):
 * update rating and count when they change. Checked 8 Oct 2026.
 */
export const GOOGLE_REVIEWS = {
  rating: 4.9,
  count: 30,
  href: "https://share.google/2mnpfOfIeGvXz2ezU",
};
