// Builds the light logo for the dark, compact sticky header: the grey
// lettering turns white, the orange swirl keeps its colours.
// Run after changing the logo: node scripts/build-logo-light.mjs
import sharp from "sharp";

const source = "public/wp-content/uploads/2016/01/logo-natuurhout-new-1.png";
const target = "public/logo-natuurhout-licht.png";

const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  if (Math.max(r, g, b) - Math.min(r, g, b) < 30) data[i] = data[i + 1] = data[i + 2] = 255;
}
await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(target);
console.log(`wrote ${target}`);
