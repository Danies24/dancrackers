/**
 * Captain code suggestion (PRD §20.2 — "generated manually, not randomly").
 * The admin sees this as an editable starting point, not an opaque value.
 */

export function derivePrefix(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.slice(0, 3).padEnd(3, "X");
}

export function suggestCaptainCode(name: string, existingCodes: string[]): string {
  const prefix = derivePrefix(name);
  const used = new Set(
    existingCodes
      .filter((c) => c.startsWith(prefix))
      .map((c) => parseInt(c.slice(3), 10))
      .filter((n) => !Number.isNaN(n)),
  );
  for (let n = 1; n <= 99; n++) {
    if (!used.has(n)) return `${prefix}${String(n).padStart(2, "0")}`;
  }
  return `${prefix}01`;
}
