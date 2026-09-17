/**
 * Uploads the 4 custom-designed combo pack hero images (title-forward,
 * yellow Gen-Z poster style, generated per the prompts written this turn)
 * to the existing `product-media` Storage bucket, resized/re-encoded via
 * sharp the same way as every other image pipeline in this repo, and sets
 * combo_packs.hero_image_url. Replaces the earlier item-photo collage.
 *
 * Usage: node scripts/upload-combo-hero-images.mjs [--dry-run]
 */
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 85;

const FILES = [
  { file: "Kids special.png", slug: "kids-special-pack" },
  { file: "Family pack.png", slug: "family-pack" },
  { file: "Night pack.png", slug: "night-pack" },
  { file: "Morning Blast.png", slug: "morning-blast-pack" },
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const dir = process.argv.find((a) => !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1]) ?? path.join(process.env.HOME ?? "", "Downloads");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  for (const { file, slug } of FILES) {
    const srcPath = path.join(dir, file);
    const raw = await readFile(srcPath);
    const webp = await sharp(raw)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    console.log(`${slug}: ${raw.length} bytes source -> ${webp.length} bytes webp`);

    if (dryRun) {
      console.log(`  [dry-run] would upload to combo-packs/${slug}.webp`);
      continue;
    }

    const storagePath = `combo-packs/${slug}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(storagePath, webp, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-media").getPublicUrl(storagePath);
    const heroImageUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase.from("combo_packs").update({ hero_image_url: heroImageUrl }).eq("slug", slug);
    if (updateError) throw updateError;

    console.log(`  uploaded -> ${heroImageUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
