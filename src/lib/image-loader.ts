/*
 * next/image loader for the static export (SEO batch 2, Nov 2026).
 *
 * Own photos (/fotos/…, /wp-content/uploads/…) point at a WebP copy of the
 * requested width: /_img/w<width>/<original path>.webp. scripts/build-images.mjs
 * writes those copies into out/ after `next build`, for every such URL in the
 * built pages; a copy that does not exist (an image only a client component
 * asks for) is answered by the Worker with the original file, so a photo never
 * breaks. Shopify CDN images get Shopify's own width parameter. SVG, GIF and
 * data: URLs stay as they are.
 */
export const IMAGE_PREFIX = "/_img/w";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("https://cdn.shopify.com/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  }
  if (!src.startsWith("/") || src.startsWith("//") || /\.(svg|gif)(\?|$)/i.test(src) || !/\.(jpe?g|png|webp)$/i.test(src)) return src;
  return `${IMAGE_PREFIX}${width}${src}.webp`;
}
