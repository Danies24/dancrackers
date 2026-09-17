/**
 * Bulk-upload the Sree Sai Ram / Kids Crackers Park product photos.
 *
 * Reads <dir>/SSR-###.{jpg,png} (skips an `extras/` subfolder), resizes each
 * to max 800px on the long edge and re-encodes as WebP q80 via sharp,
 * uploads to the existing `product-media` Storage bucket at
 * `ssr/SSR-###.webp` (upsert), and sets that product's `image_url` (with a
 * `?v=<timestamp>` cache-buster) — only where it is currently null, unless
 * --force is passed.
 *
 * Usage:
 *   node scripts/upload-ssr-images.mjs [dir] [--dry-run] [--force]
 *
 * Without --dry-run this WRITES to Storage and the database — only run it
 * after explicit confirmation.
 */
import { config } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DEFAULT_DIR = path.join(process.env.HOME ?? "", "Downloads/supplier-product-photos/ssr-images");
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 80;
const SKU_PATTERN = /^SSR-(\d{3})\.(jpg|jpeg|png)$/i;

async function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith("--")) ?? DEFAULT_DIR;
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && SKU_PATTERN.test(e.name))
    .map((e) => ({ name: e.name, sku: `SSR-${SKU_PATTERN.exec(e.name)[1]}` }))
    .sort((a, b) => a.sku.localeCompare(b.sku));

  console.log(`Found ${files.length} SSR image files in ${dir}${dryRun ? " (dry run)" : ""}${force ? " (force)" : ""}`);

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, sku, image_url")
    .like("sku", "SSR-%");
  if (productsError) {
    console.error("Could not load products:", productsError.message);
    process.exit(1);
  }
  const bySku = new Map(products.map((p) => [p.sku, p]));

  let uploaded = 0;
  let skippedHasPhoto = 0;
  let skippedNoProduct = 0;
  let failed = 0;

  for (const file of files) {
    const product = bySku.get(file.sku);
    if (!product) {
      console.warn(`  ${file.sku}: no matching product — skipped`);
      skippedNoProduct++;
      continue;
    }
    if (product.image_url && !force) {
      skippedHasPhoto++;
      continue;
    }

    const storagePath = `ssr/${file.sku}.webp`;
    if (dryRun) {
      console.log(`  ${file.sku}: would resize + upload to ${storagePath} and set image_url`);
      uploaded++;
      continue;
    }

    try {
      const original = await readFile(path.join(dir, file.name));
      const resized = await sharp(original)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(storagePath, resized, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-media").getPublicUrl(storagePath);
      const imageUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: imageUrl })
        .eq("id", product.id);
      if (updateError) throw updateError;

      console.log(`  ${file.sku}: uploaded`);
      uploaded++;
    } catch (err) {
      console.error(`  ${file.sku}: FAILED — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log("\nSummary:");
  console.log(`  Uploaded:              ${uploaded}`);
  console.log(`  Skipped (has photo):   ${skippedHasPhoto}`);
  console.log(`  Skipped (no product):  ${skippedNoProduct}`);
  console.log(`  Failed:                ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
