import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import { diffImport, parseCatalogueCsv } from "@/lib/csv-import";
import { slugify } from "@/lib/slugify";

const bodySchema = z.object({
  csv: z.string().min(1),
  confirmMissing: z.boolean().optional(),
});

/**
 * POST /api/admin/products/import (§14.5, §22.2). `?dryRun=true` returns a
 * diff and changes nothing. Without it, commits: upsert on sku, write
 * price_history for every change, never delete — missing products are only
 * marked 'unavailable' if the caller explicitly confirms (§33 case 29).
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "true";

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "invalid_body", message: "A CSV body is required." } }, { status: 400 });
  }

  const { rows, errors } = parseCatalogueCsv(parsed.data.csv);
  const supabase = createAdminClient();

  const { data: existingProducts } = await supabase.from("products").select("sku, price");
  const diff = diffImport(rows, errors, existingProducts ?? []);

  if (dryRun) {
    return NextResponse.json(diff);
  }

  // ── Commit ──
  const admin = await getCurrentAdminUser();
  const { data: categories } = await supabase.from("categories").select("id, slug, name_en");
  const categoryByName = new Map((categories ?? []).map((c) => [c.name_en.toLowerCase(), c.id]));

  let created = 0;
  let updated = 0;
  const commitErrors: Array<{ sku: string; reason: string }> = [];

  for (const row of rows) {
    let categoryId = categoryByName.get(row.category.toLowerCase());
    if (!categoryId) {
      const slug = slugify(row.category);
      const { data: newCategory, error: catError } = await supabase
        .from("categories")
        .insert({ slug, name_en: row.category, display_order: categoryByName.size + 1 })
        .select("id")
        .single();
      if (catError || !newCategory) {
        commitErrors.push({ sku: row.sku, reason: `Could not create category "${row.category}"` });
        continue;
      }
      categoryId = newCategory.id;
      categoryByName.set(row.category.toLowerCase(), categoryId);
    }

    const existing = (existingProducts ?? []).find((p) => p.sku === row.sku);

    const slug = slugify(row.name_en);

    const { data: upserted, error: upsertError } = await supabase
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

    if (upsertError || !upserted) {
      commitErrors.push({ sku: row.sku, reason: upsertError?.message ?? "Upsert failed" });
      continue;
    }

    if (existing && existing.price !== row.price) {
      await supabase.from("price_history").insert({
        product_id: upserted.id,
        old_price: existing.price,
        new_price: row.price,
        changed_by: admin?.email ?? "csv-import",
        reason: "Catalogue CSV import",
      });
    }

    existing ? updated++ : created++;
  }

  if (parsed.data.confirmMissing && diff.missingSkus.length > 0) {
    await supabase.from("products").update({ status: "unavailable" }).in("sku", diff.missingSkus);
  }

  return NextResponse.json({
    created,
    updated,
    markedUnavailable: parsed.data.confirmMissing ? diff.missingSkus.length : 0,
    errors: commitErrors,
  });
}
