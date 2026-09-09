/** Indian-numbering currency and display formatting (PRD §15.4, §15.6, §22.3). */

const inrGrouper = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** Formats a rupee amount with Indian grouping and no trailing decimals: ₹1,23,456 */
export function formatRupees(value: number): string {
  return `₹${inrGrouper.format(Math.round(value))}`;
}

/** Formats a rupee amount without the ₹ symbol, for contexts that add their own. */
export function formatNumberIndian(value: number): string {
  return inrGrouper.format(Math.round(value));
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

const unitLabels: Record<string, string> = {
  pkt: "packet",
  pcs: "piece",
  box: "box",
  bundle: "bundle",
};

export function formatUnit(unit: string): string {
  return unitLabels[unit] ?? unit;
}

/** IST-rendered date/time for admin surfaces. Data is stored as ISO 8601 UTC (§22.3). */
export function formatIST(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}
