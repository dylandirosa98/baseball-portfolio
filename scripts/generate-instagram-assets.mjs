import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const temporaryBundle = "/tmp/diamond-instagram-renderer.cjs";
const outputRoot = path.join(root, "public", "instagram-content");
const manifestPath = process.argv[2];

await build({
  entryPoints: [path.join(root, "scripts", "instagram-render-entry.tsx")],
  outfile: temporaryBundle,
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
});

const require = createRequire(import.meta.url);
delete require.cache[temporaryBundle];
const { renderCarousels } = require(temporaryBundle);
const carousels = await renderCarousels();
const manifest = [];

for (const carousel of carousels) {
  const directory = path.join(outputRoot, carousel.id);
  await mkdir(directory, { recursive: true });
  const slides = [];
  for (let index = 0; index < carousel.svgs.length; index += 1) {
    const filename = `${String(index + 1).padStart(2, "0")}.jpg`;
    const target = path.join(directory, filename);
    const sharp = (await import("sharp")).default;
    await sharp(Buffer.from(carousel.svgs[index])).jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(target);
    slides.push(`https://diamondprofile.app/instagram-content/${carousel.id}/${filename}`);
  }
  manifest.push({
    id: carousel.id,
    title: carousel.title,
    category: carousel.category,
    objective: carousel.objective,
    caption: carousel.caption,
    slides,
  });
}

if (manifestPath) {
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o644 });
}

const count = manifest.reduce((sum, item) => sum + item.slides.length, 0);
process.stdout.write(`Generated ${count} Instagram images across ${manifest.length} carousels.\n`);
