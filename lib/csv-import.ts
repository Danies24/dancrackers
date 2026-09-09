import Papa from "papaparse";

/**
 * Catalogue CSV import (§14.5). Columns exactly as specified there: sku,
 * name_en, name_ta, category, price, unit, is_discountable, display_order.
 */

export interface ImportRow {
  rowNumber: number; // 1-indexed, matching what a human would see in a spreadsheet (header = row 1)
  sku: string;
  name_en: string;
  name_ta: string | null;
  category: string;
  price: number | null;
  unit: string;
  is_discountable: boolean;
  display_order: number;
}

export interface ImportError {
  rowNumber: number;
  reason: string;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: ImportError[];
}

const UNIT_ALIASES: Record<string, string> = {
  pkt: "pkt",
  packet: "pkt",
  pack: "pkt",
  pcs: "pcs",
  pc: "pcs",
  piece: "pcs",
  pieces: "pcs",
  box: "box",
  boxes: "box",
  bundle: "bundle",
  bundles: "bundle",
};

function normalizeUnit(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  return UNIT_ALIASES[key] ?? null;
}

/** Strips currency symbols/commas. Blank stays blank — never zeroed (§14.5 step 2). */
function parsePrice(raw: string): { value: number | null; error?: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null };
  const cleaned = trimmed.replace(/[₹,\s]/g, "");
  const value = Number(cleaned);
  if (Number.isNaN(value) || value < 0) return { value: null, error: `Invalid price "${raw}"` };
  return { value };
}

export function parseCatalogueCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];

  parsed.data.forEach((raw, i) => {
    const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
    const sku = (raw.sku ?? "").trim();
    const name_en = (raw.name_en ?? "").trim();
    const category = (raw.category ?? "").trim();

    if (!sku) {
      errors.push({ rowNumber, reason: "Missing sku" });
      return;
    }
    if (!name_en) {
      errors.push({ rowNumber, reason: "Missing name_en" });
      return;
    }
    if (!category) {
      errors.push({ rowNumber, reason: "Missing category" });
      return;
    }

    const unitRaw = (raw.unit ?? "pkt").trim();
    const unit = normalizeUnit(unitRaw);
    if (!unit) {
      errors.push({ rowNumber, reason: `Unrecognised unit "${unitRaw}"` });
      return;
    }

    const { value: price, error: priceError } = parsePrice(raw.price ?? "");
    if (priceError) {
      errors.push({ rowNumber, reason: priceError });
      return;
    }

    const isDiscountableRaw = (raw.is_discountable ?? "true").trim().toLowerCase();
    const is_discountable = !["false", "0", "no"].includes(isDiscountableRaw);

    const displayOrderRaw = (raw.display_order ?? "").trim();
    const display_order = displayOrderRaw ? Number(displayOrderRaw) || 0 : i;

    rows.push({
      rowNumber,
      sku,
      name_en,
      name_ta: raw.name_ta?.trim() || null,
      category,
      price,
      unit,
      is_discountable,
      display_order,
    });
  });

  return { rows, errors };
}

export interface ExistingProduct {
  sku: string;
  price: number | null;
}

export interface ImportDiff {
  newProducts: ImportRow[];
  priceChanges: Array<{ sku: string; name_en: string; oldPrice: number | null; newPrice: number | null }>;
  unchanged: ImportRow[];
  missingSkus: string[]; // in DB, absent from file — proposed 'unavailable'
  errors: ImportError[];
}

export function diffImport(rows: ImportRow[], errors: ImportError[], existing: ExistingProduct[]): ImportDiff {
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));
  const fileSkus = new Set(rows.map((r) => r.sku));

  const newProducts: ImportRow[] = [];
  const priceChanges: ImportDiff["priceChanges"] = [];
  const unchanged: ImportRow[] = [];

  for (const row of rows) {
    const existingProduct = existingBySku.get(row.sku);
    if (!existingProduct) {
      newProducts.push(row);
    } else if (existingProduct.price !== row.price) {
      priceChanges.push({ sku: row.sku, name_en: row.name_en, oldPrice: existingProduct.price, newPrice: row.price });
    } else {
      unchanged.push(row);
    }
  }

  const missingSkus = existing.filter((p) => !fileSkus.has(p.sku)).map((p) => p.sku);

  return { newProducts, priceChanges, unchanged, missingSkus, errors };
}
