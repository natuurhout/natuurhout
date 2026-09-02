import type { Product } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

const entity = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Natuurhout",
  url: `${siteUrl}/`,
};

export function plainTextFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function productDescription(product: Product) {
  const description = plainTextFromHtml(product.bodyHtml);
  if (!description) return `${product.title} van Natuurhout.`;
  const contextual = description.toLocaleLowerCase("nl").startsWith(product.title.toLocaleLowerCase("nl"))
    ? description
    : `${product.title}: ${description}`;
  return contextual.length <= 155 ? contextual : `${contextual.slice(0, 152).trimEnd()}…`;
}

export function productBodyHtml(product: Product) {
  return product.bodyHtml
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>");
}

export function productMetadataTitle(product: Product) {
  if (product.handle === "robinia-palen") return "Robinia palen kopen | Natuurhout";
  return `${product.title} | Natuurhout`;
}

export function productStructuredData(product: Product): Record<string, unknown> {
  const canonical = `${siteUrl}/shop/${product.handle}/`;
  const offers = product.variants.map((variant) => ({
    "@type": "Offer",
    sku: String(variant.id),
    price: variant.price,
    priceCurrency: "EUR",
    availability: `https://schema.org/${variant.available ? "InStock" : "OutOfStock"}`,
    itemCondition: "https://schema.org/NewCondition",
    url: `${product.shopUrl}?variant=${variant.id}`,
    seller: { "@id": `${siteUrl}/#organization` },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      entity,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop/` },
          { "@type": "ListItem", position: 3, name: product.title, item: canonical },
        ],
      },
      {
        "@type": "Product",
        "@id": `${canonical}#product`,
        name: product.title,
        description: plainTextFromHtml(product.bodyHtml) || `${product.title} van Natuurhout.`,
        image: product.images.map((image) => image.src),
        brand: { "@type": "Brand", name: "Natuurhout" },
        category: product.tags.join(", ") || "Tuinproducten",
        offers,
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: `${product.title} | Natuurhout`,
        description: productDescription(product),
        inLanguage: "nl-BE",
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        mainEntity: { "@id": `${canonical}#product` },
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}
