import { describe, expect, it } from "vitest";
import { buildCustomerMessage, buildSupplierMessage, buildWhatsAppUrl } from "./whatsapp";

describe("buildWhatsAppUrl — encoding (§39.1)", () => {
  it("encodes newlines as %0A", () => {
    const url = buildWhatsAppUrl("9876543210", "line1\nline2");
    expect(url).toContain("line1%0Aline2");
  });

  it("encodes & so it cannot be mistaken for a query separator", () => {
    const url = buildWhatsAppUrl("9876543210", "Fish & Chips");
    expect(url).toContain("Fish%20%26%20Chips");
    expect(url.split("?text=")[1]).not.toContain("&Chips");
  });

  it("encodes # so it does not truncate the message", () => {
    const url = buildWhatsAppUrl("9876543210", "Flat #4B");
    expect(url).toContain("%234B");
  });

  it("encodes + and Tamil characters", () => {
    const url = buildWhatsAppUrl("9876543210", "5 in 1 + சக்கரம்");
    expect(url).toContain("%2B");
    expect(url).not.toContain("சக்கரம்"); // must be percent-encoded, not raw
  });

  it("prefixes 91 with no plus and strips non-digits from the phone", () => {
    const url = buildWhatsAppUrl("98765 43210", "hi");
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
  });
});

describe("buildCustomerMessage — truncation past 12 items (§17.2)", () => {
  const baseItem = { nameEn: "Seven Shot", quantity: 1, unit: "pkt", lineTotal: 100 };

  it("lists all items when 10 or fewer", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ ...baseItem, nameEn: `Item ${i + 1}` }));
    const msg = buildCustomerMessage({
      orderRef: "DC-2609-0001",
      name: "Priya",
      phone: "9876543210",
      items,
      grandTotal: 1000,
      address: "Test address",
    });
    expect(msg).toContain("Item 10");
    expect(msg).not.toContain("more item");
  });

  it("truncates to 10 items plus a count of the rest when there are 15", () => {
    const items = Array.from({ length: 15 }, (_, i) => ({ ...baseItem, nameEn: `Item ${i + 1}` }));
    const msg = buildCustomerMessage({
      orderRef: "DC-2609-0001",
      name: "Priya",
      phone: "9876543210",
      items,
      grandTotal: 1000,
      address: "Test address",
    });
    expect(msg).toContain("Item 10");
    expect(msg).not.toContain("Item 11");
    expect(msg).toContain("…and 5 more items");
  });

  it("includes the order reference and estimated total", () => {
    const msg = buildCustomerMessage({
      orderRef: "DC-2609-0147",
      name: "Priya R",
      phone: "9876543210",
      items: [baseItem],
      grandTotal: 5856,
      address: "12/4 Sunrise Apartments",
    });
    expect(msg).toContain("DC-2609-0147");
    expect(msg).toContain("₹5,856");
    expect(msg).toContain("Please confirm.");
  });
});

describe("buildSupplierMessage — includes SKU on every line (§17.4)", () => {
  it("includes every item's SKU", () => {
    const msg = buildSupplierMessage({
      supplierName: "Gurusamy Fireworks",
      orderRef: "DC-2609-0147",
      dateDisplay: "12-10-2026",
      bookedByPhone: "9XXXXXXXXX",
      customerName: "Priya R",
      customerPhone: "9876543210",
      address: "12/4 Sunrise Apartments, Perungudi",
      city: "Chennai",
      pincode: "600096",
      items: [
        { sku: "047", nameEn: "Seven Shot", unit: "pkt", quantity: 10, rate: 144, amount: 1440 },
        { sku: "178", nameEn: "Premium Gift Box", unit: "box", quantity: 1, rate: 3750, amount: 3750 },
      ],
      subtotal: 5190,
      discountPercent: 10,
      discountAmount: 144,
      grandTotal: 5046,
    });
    expect(msg).toContain("047");
    expect(msg).toContain("178");
    expect(msg).toContain("GURUSAMY FIREWORKS — ORDER");
    expect(msg).toContain("Please confirm availability");
  });
});
