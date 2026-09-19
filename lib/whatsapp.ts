import { formatNumberIndian, formatRupees } from "./format";
import { brandConfig } from "@/config/brandConfig";

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
  /** Item subtotal, before packaging/delivery — omit charge lines entirely when not given. */
  subtotal?: number;
  packagingCharge?: number;
  deliveryCharge?: number;
  grandTotal: number;
  address: string;
}

/** Message 1 — customer to us (§17.3). Secondary action; the enquiry is already saved. */
export function buildCustomerMessage(input: CustomerMessageInput): string {
  const chargeLines: string[] = [];
  if (input.subtotal != null && (input.packagingCharge || input.deliveryCharge)) {
    chargeLines.push("", `Item subtotal: ${formatRupees(input.subtotal)}`);
    chargeLines.push(
      `Packaging charge (${brandConfig.cartCharges.packagingChargePercent}%): ${input.packagingCharge ? formatRupees(input.packagingCharge) : "Free"}`,
    );
    chargeLines.push(`Delivery charge: ${input.deliveryCharge ? formatRupees(input.deliveryCharge) : "Free"}`);
  }

  return [
    brandConfig.messages.whatsappGreeting,
    "",
    `Ref: ${input.orderRef}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    "",
    "Items:",
    formatItemLines(input.items),
    ...chargeLines,
    "",
    `Estimated total: ${formatRupees(input.grandTotal)}`,
    "",
    "Address:",
    input.address,
    "",
    "Please confirm.",
  ].join("\n");
}

export interface CustomerUpdateMessageInput {
  orderRef: string;
  items: WhatsAppOrderItem[];
  grandTotal: number;
  lrNumber?: string | null;
  transportName?: string | null;
  trackingUrl?: string | null;
}

/**
 * Post-order status update to the customer — order no., items, customer
 * total, and dispatch tracking once available. Deliberately carries no
 * supplier figures (rate, supplier total, commission) — this is the
 * customer-facing counterpart to buildSupplierMessage, not a variant of it.
 */
export function buildCustomerUpdateMessage(input: CustomerUpdateMessageInput): string {
  const lines = [
    `Update on your order ${input.orderRef}`,
    "",
    "Items:",
    formatItemLines(input.items),
    "",
    `Total: ${formatRupees(input.grandTotal)}`,
  ];
  if (input.lrNumber) {
    lines.push("", "Dispatched.", `LR number: ${input.lrNumber}`);
    if (input.transportName) lines.push(`Transport: ${input.transportName}`);
    if (input.trackingUrl) lines.push(`Track: ${input.trackingUrl}`);
  }
  return lines.join("\n");
}

export interface SupplierMessageInput {
  supplierName: string;
  orderRef: string;
  dateDisplay: string; // DD-MM-YYYY
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
    `${brandConfig.messages.supplierOrderHeader} (${input.bookedByPhone})`,
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
    "SKU  | Item               | Unit |  Qty | Rate | Amount",
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
  return brandConfig.messages.captainShareMessage.replace("{link}", link);
}
