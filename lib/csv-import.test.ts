import { describe, expect, it } from "vitest";
import { diffImport, parseCatalogueCsv } from "./csv-import";

describe("parseCatalogueCsv", () => {
  it("parses a well-formed row", () => {
    const csv = "sku,name_en,name_ta,category,price,unit,is_discountable,display_order\n047,Seven Shot,7 ஷாட்,Multi Shots,144,Pkt,true,1";
    const { rows, errors } = parseCatalogueCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sku: "047", name_en: "Seven Shot", price: 144, unit: "pkt", is_discountable: true });
  });

  it("normalises unit case and synonyms", () => {
    const csv = "sku,name_en,category,unit\n1,A,Cat,PACKET\n2,B,Cat,Box\n3,C,Cat,pcs";
    const { rows, errors } = parseCatalogueCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows.map((r) => r.unit)).toEqual(["pkt", "box", "pcs"]);
  });

  it("reports an unmappable unit and halts only that row", () => {
    const csv = "sku,name_en,category,unit\n1,A,Cat,pkt\n2,B,Cat,dozen";
    const { rows, errors } = parseCatalogueCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ rowNumber: 3, reason: expect.stringContaining("dozen") });
  });

  it("leaves price blank rather than zeroing it", () => {
    const csv = "sku,name_en,category,price\n1,A,Cat,";
    const { rows, errors } = parseCatalogueCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0].price).toBeNull();
  });

  it("strips currency symbols and commas from price", () => {
    const csv = "sku,name_en,category,price\n1,A,Cat,\"₹1,234.50\"";
    const { rows } = parseCatalogueCsv(csv);
    expect(rows[0].price).toBe(1234.5);
  });

  it("reports missing required fields with the correct row number", () => {
    const csv = "sku,name_en,category\n1,A,Cat\n,Missing SKU,Cat\n2,,Cat";
    const { rows, errors } = parseCatalogueCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors).toEqual([
      { rowNumber: 3, reason: "Missing sku" },
      { rowNumber: 4, reason: "Missing name_en" },
    ]);
  });

  it("defaults is_discountable to true when omitted", () => {
    const csv = "sku,name_en,category\n1,A,Cat";
    const { rows } = parseCatalogueCsv(csv);
    expect(rows[0].is_discountable).toBe(true);
  });

  it("respects is_discountable=false", () => {
    const csv = "sku,name_en,category,is_discountable\n1,A,Cat,false";
    const { rows } = parseCatalogueCsv(csv);
    expect(rows[0].is_discountable).toBe(false);
  });
});

describe("diffImport", () => {
  const existing = [
    { sku: "001", price: 100 },
    { sku: "002", price: 200 },
    { sku: "003", price: null },
  ];

  it("classifies a new product", () => {
    const rows = [{ rowNumber: 2, sku: "999", name_en: "New", name_ta: null, category: "Cat", price: 50, unit: "pkt", is_discountable: true, display_order: 0 }];
    const diff = diffImport(rows, [], existing);
    expect(diff.newProducts).toHaveLength(1);
    expect(diff.priceChanges).toHaveLength(0);
  });

  it("classifies a price change", () => {
    const rows = [{ rowNumber: 2, sku: "001", name_en: "A", name_ta: null, category: "Cat", price: 150, unit: "pkt", is_discountable: true, display_order: 0 }];
    const diff = diffImport(rows, [], existing);
    expect(diff.priceChanges).toEqual([{ sku: "001", name_en: "A", oldPrice: 100, newPrice: 150 }]);
  });

  it("classifies an unchanged product", () => {
    const rows = [{ rowNumber: 2, sku: "002", name_en: "B", name_ta: null, category: "Cat", price: 200, unit: "pkt", is_discountable: true, display_order: 0 }];
    const diff = diffImport(rows, [], existing);
    expect(diff.unchanged).toHaveLength(1);
    expect(diff.priceChanges).toHaveLength(0);
  });

  it("proposes 'unavailable' for DB products absent from the file", () => {
    const rows = [{ rowNumber: 2, sku: "001", name_en: "A", name_ta: null, category: "Cat", price: 100, unit: "pkt", is_discountable: true, display_order: 0 }];
    const diff = diffImport(rows, [], existing);
    expect(diff.missingSkus.sort()).toEqual(["002", "003"]);
  });

  it("commits nothing itself — it only classifies (dry-run safe by construction)", () => {
    const rows = [{ rowNumber: 2, sku: "001", name_en: "A", name_ta: null, category: "Cat", price: 999, unit: "pkt", is_discountable: true, display_order: 0 }];
    const before = JSON.stringify(existing);
    diffImport(rows, [], existing);
    expect(JSON.stringify(existing)).toBe(before);
  });
});
