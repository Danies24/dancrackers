/**
 * CLI catalogue import (§14.5) — the same logic as
 * /api/admin/products/import, runnable directly against a CSV file without
 * going through the admin UI. Useful for the initial real-catalogue import.
 *
 * Usage:
 *   npx tsx scripts/import-catalogue.ts <path-to-csv> [--commit] [--confirm-missing]
 *
 * Without --commit, this only prints the dry-run diff and changes nothing.
 */
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { diffImport, parseCatalogueCsv } from "../lib/csv-import";

config({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  const commit = args.includes("--commit");
  const confirmMissing = args.includes("--confirm-missing");

  if (!filePath) {
    console.error("Usage: tsx scripts/import-catalogue.ts <path-to-csv> [--commit] [--confirm-missing]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
    process.exit(1);
  }

  const csvText = await readFile(filePath, "utf-8");
  const { rows, errors } = parseCatalogueCsv(csvText);
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: existingProducts } = await supabase.from("products").select("sku, price");
  const diff = diffImport(rows, errors, existingProducts ?? []);

  console.log(`\n${diff.newProducts.length} new products`);
  diff.newProducts.slice(0, 20).forEach((r) => console.log(`  + ${r.sku} — ${r.name_en} — ${r.price ?? "no price"}`));

  console.log(`\n${diff.priceChanges.length} price changes`);
  diff.priceChanges.slice(0, 20).forEach((c) => console.log(`  ~ ${c.sku} — ${c.name_en}: ${c.oldPrice} → ${c.newPrice}`));

  console.log(`\n${diff.missingSkus.length} products in DB but absent from this file`);
  if (diff.missingSkus.length > 0) console.log(`  ${diff.missingSkus.slice(0, 20).join(", ")}${diff.missingSkus.length > 20 ? "…" : ""}`);

  console.log(`\n${diff.errors.length} rows with errors`);
  diff.errors.forEach((e) => console.log(`  ! Row ${e.rowNumber}: ${e.reason}`));

  if (!commit) {
    console.log("\nDry run only — nothing was written. Re-run with --commit to apply.");
    return;
  }

  console.log("\nCommitting…");
  const { data: categories } = await supabase.from("categories").select("id, slug, name_en");
  const categoryByName = new Map((categories ?? []).map((c) => [c.name_en.toLowerCase(), c.id]));

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    let categoryId = categoryByName.get(row.category.toLowerCase());
    if (!categoryId) {
      const slug = row.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: newCategory } = await supabase
        .from("categories")
        .insert({ slug, name_en: row.category, display_order: categoryByName.size + 1 })
        .select("id")
        .single();
      if (!newCategory) continue;
      categoryId = newCategory.id;
      categoryByName.set(row.category.toLowerCase(), categoryId);
    }

    const existing = (existingProducts ?? []).find((p) => p.sku === row.sku);
    const slug = row.name_en.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: upserted } = await supabase
      .from("products")
      .upsert(
        {
          sku: row.sku,
          slug,
          name_en: row.name_en,
          name_ta: row.name_ta,
          category_id: categoryId,
          price: row.price,
          unit: row.unit,
          is_discountable: row.is_discountable,
          display_order: row.display_order,
        },
        { onConflict: "sku" },
      )
      .select("id")
      .single();

    if (!upserted) continue;

    if (existing && existing.price !== row.price) {
      await supabase.from("price_history").insert({
        product_id: upserted.id,
        old_price: existing.price,
        new_price: row.price,
        changed_by: "cli-import",
        reason: "Catalogue CSV import (CLI)",
      });
    }
    existing ? updated++ : created++;
  }

  if (confirmMissing && diff.missingSkus.length > 0) {
    await supabase.from("products").update({ status: "unavailable" }).in("sku", diff.missingSkus);
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${confirmMissing ? diff.missingSkus.length : 0} marked unavailable.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
