/**
 * Builds each combo pack's hero image as a 2x2 collage of real photos of
 * its own top items (by quantity, from the Large variety) — never a stock
 * or mismatched supplier photo, since no one has photographed these
 * specific curated baskets. Every tile is a real SKU actually inside the
 * pack, so the image is honest even though it's composited.
 *
 * Uploads to the existing `product-media` Storage bucket at
 * `combo-packs/<slug>.webp` and sets combo_packs.hero_image_url.
 *
 * Usage:
 *   node scripts/generate-combo-hero-images.mjs [--dry-run]
 */
import { config } from "dotenv";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const TILE = 500; // each of the 4 quadrants, px
const GAP = 6;
const CANVAS = TILE * 2 + GAP;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: packs, error: packsError } = await supabase
    .from("combo_packs")
    .select("id, slug, name")
    .order("display_order");
  if (packsError) throw packsError;

  const { data: largeVarieties, error: varietiesError } = await supabase
    .from("combo_pack_varieties")
    .select("id, combo_pack_id")
    .eq("tier_label", "Large");
  if (varietiesError) throw varietiesError;

  for (const pack of packs) {
    const variety = largeVarieties.find((v) => v.combo_pack_id === pack.id);
    if (!variety) {
      console.log(`${pack.name}: no Large variety, skipping`);
      continue;
    }

    const { data: items, error: itemsError } = await supabase
      .from("combo_pack_items")
      .select("quantity, products(sku, name_en, image_url)")
      .eq("variety_id", variety.id)
      .order("quantity", { ascending: false });
    if (itemsError) throw itemsError;

    const tiles = items.filter((i) => i.products?.image_url).slice(0, 4);
    if (tiles.length < 4) {
      console.log(`${pack.name}: only ${tiles.length} items with photos, need 4 — skipping`);
      continue;
    }
    console.log(`${pack.name}: using ${tiles.map((t) => t.products.sku).join(", ")}`);

    const tileBuffers = await Promise.all(
      tiles.map(async (t) => {
        const res = await fetch(t.products.image_url);
        if (!res.ok) throw new Error(`Failed to fetch ${t.products.image_url}: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        return sharp(buf)
          .resize(TILE, TILE, { fit: "contain", background: "#f7f5f2" })
          .toBuffer();
      }),
    );

    const collage = await sharp({
      create: { width: CANVAS, height: CANVAS, channels: 3, background: "#171b2e" },
    })
      .composite([
        { input: tileBuffers[0], left: 0, top: 0 },
        { input: tileBuffers[1], left: TILE + GAP, top: 0 },
        { input: tileBuffers[2], left: 0, top: TILE + GAP },
        { input: tileBuffers[3], left: TILE + GAP, top: TILE + GAP },
      ])
      .webp({ quality: 82 })
      .toBuffer();

    if (dryRun) {
      console.log(`  [dry-run] would upload ${collage.length} bytes to combo-packs/${pack.slug}.webp`);
      continue;
    }

    const path = `combo-packs/${pack.slug}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(path, collage, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-media").getPublicUrl(path);
    const heroImageUrl = `${publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("combo_packs")
      .update({ hero_image_url: heroImageUrl })
      .eq("id", pack.id);
    if (updateError) throw updateError;

    console.log(`  uploaded -> ${heroImageUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
