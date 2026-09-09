import { formatNumberIndian, formatRupees } from "./format";

/**
 * The three wa.me messages (PRD §17). wa.me deep links only — no Business
 * API. Every body is built here and nowhere else, so encoding and the
 * truncation rule are applied consistently.
 */

export interface WhatsAppOrderItem {
  nameEn: string;
  quantity: number;
  unit: string;
  lineTotal: number;
}

const MAX_ITEMS_IN_MESSAGE = 10;

function unitLabel(unit: string): string {
  const map: Record<string, string> = { pkt: "pkt", pcs: "pcs", box: "box", bundle: "bundle" };
  return map[unit] ?? unit;
}

/** Lists up to 10 items, then "...and N more items" (§17.2 — keeps the URL under ~2,000 chars). */
function formatItemLines(items: WhatsAppOrderItem[]): string {
  const shown = items.slice(0, MAX_ITEMS_IN_MESSAGE);
  const lines = shown.map(
    (item, i) =>
      `${i + 1}. ${item.nameEn} — ${item.quantity} ${unitLabel(item.unit)} — ${formatRupees(item.lineTotal)}`,
  );
  const remaining = items.length - shown.length;
  if (remaining > 0) lines.push(`…and ${remaining} more item${remaining === 1 ? "" : "s"}`);
  return lines.join("\n");
}

/** Builds a wa.me URL from a phone (10 digits, no +91) and a message body. */
export function buildWhatsAppUrl(phone10Digit: string, body: string): string {
  const digits = phone10Digit.replace(/\D/g, "");
  return `https://wa.me/91${digits}?text=${encodeURIComponent(body)}`;
}

export interface CustomerMessageInput {
  orderRef: string;
  name: string;
  phone: string;
  items: WhatsAppOrderItem[];
  grandTotal: number;
  address: string;
}

/** Message 1 — customer to us (§17.3). Secondary action; the enquiry is already saved. */
export function buildCustomerMessage(input: CustomerMessageInput): string {
  return [
    "Hi Dan Crackers, I have submitted an order enquiry.",
    "",
    `Ref: ${input.orderRef}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    "",
    "Items:",
    formatItemLines(input.items),
    "",
    `Estimated total: ${formatRupees(input.grandTotal)}`,
    "",
    "Address:",
    input.address,
    "",
    "Please confirm.",
  ].join("\n");
}

export interface SupplierMessageInput {
  supplierName: string;
  orderRef: string;
  dateDisplay: string; // DD-MM-YYYY
  bookedByName: string;
  bookedByPhone: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  items: Array<{ sku: string; nameEn: string; unit: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
}

/** Message 2 — us to the supplier (§17.4). A commercial document; SKUs are mandatory. */
export function buildSupplierMessage(input: SupplierMessageInput): string {
  const itemLines = input.items.map((item) => {
    const cols = [
      item.sku.padEnd(4),
      item.nameEn.slice(0, 18).padEnd(18),
      item.unit.padEnd(4),
      String(item.quantity).padStart(3),
      String(Math.round(item.rate)).padStart(5),
      formatNumberIndian(item.amount).padStart(7),
    ];
    return cols.join(" | ");
  });

  const lines = [
    `${input.supplierName.toUpperCase()} — ORDER`,
    "",
    `Our ref: ${input.orderRef}`,
    `Date: ${input.dateDisplay}`,
    `Booked by: Dan Crackers (${input.bookedByName}, ${input.bookedByPhone})`,
    "",
    "DELIVER TO",
    `${input.customerName} — ${input.customerPhone}`,
    input.address,
    `${input.city} ${input.pincode}`,
  ];
  if (input.landmark) lines.push(`Landmark: ${input.landmark}`);
  lines.push(
    "",
    "ITEMS",
    "S.No | Item               | Unit |  Qty | Rate | Amount",
    ...itemLines,
    "",
    `Subtotal          ${formatNumberIndian(input.subtotal)}`,
  );
  if (input.discountAmount > 0) {
    lines.push(
      `Discount (${input.discountPercent}%)     -${formatNumberIndian(input.discountAmount)}   (net-rate items excluded)`,
    );
  }
  lines.push(
    `TOTAL             ${formatNumberIndian(input.grandTotal)}`,
    "",
    "Please confirm availability, final amount, and payment details.",
  );
  return lines.join("\n");
}

/** Message 3 — captain kit (§17.5, §20.7). Tamil/English mixed, ready to forward as-is. */
export function buildCaptainKitMessage(captainCode: string, siteUrl: string): string {
  const link = `${siteUrl.replace(/\/$/, "")}/c/${captainCode}`;
  return `Naan indha Deepavali crackers Sivakasi-la irundhu direct-a order panren. Rate ellame website-la clear-a irukku, delivery gate varaikkum vandhudum. Idho link — ${link}`;
}
