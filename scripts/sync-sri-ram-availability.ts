/**
 * Compare Sri Ram Crackers' catalogue here against the owner's live site
 * (kidscrackerspark.com/product.php), which is where they update stock.
 *
 *   npx tsx scripts/sync-sri-ram-availability.ts
 *
 * Read-only: prints what should change plus the SQL to run in the Supabase
 * SQL editor. Nothing is written. Products missing from the owner's site go
 * to 'unavailable' (reversible), products that reappear go back to 'active'.
 * Names that don't match but look close are listed for review, not changed.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SOURCE_URL = "https://kidscrackerspark.com/product.php";
const SHOP_SLUG = "sri-ram-crackers";

/** Kolagalam normalized name -> normalized name on the owner's site, for known renames. */
const ALIASES: Record<string, string> = {
  "4 deluxe hulk": "4 hulk",
  "4 laxmi dlx": "4 deluxe laxmi",
  "100 bijili": "red bijili",
  "colour koti brand pot girl": "pot girl",
  "deluxe tricolour fountain": "tricolour fountain",
  "kungfu panda": "kungfu panda avengers",
  "robo kids minion": "robo kids minion",
  "damo sea horse shark": "damo sea horse shark corcodile",
  "4.5 bahubali machine": "4.5 bahubali machine captain america",
  "classic bomb": "classic bomb tracer",
  "king rider bomb": "mega king rider bomb",
  "super kings matchs": "super kings matches",
  "mr.beean": "mr. beean",
  "super star double ball": "super star double ball standard",
  "15 colour smoke shot": "15 shot colour smoke",
  "seeti maar whistling rider": "seeti maar whistling",
  "60 shot s.k maruthi": "60 shot sk maruthi",
  tirisullam: "tirisulam",
  "4 water falls fountain dlx": "4 water falls fountain",
  "ninijan chakkar": "ninjan chakkar",
};

/** Deliberately unavailable (no price in the owner's list) — never touched by this script. */
const IGNORE_SLUGS = new Set(["2-pipe-3-pcs-129"]);

export function normalize(raw: string): string {
  // Known limitation: "English - Tamil" rows are cut at the first " - ", so
  // "GUN - SPECIAL / PREMIUM / AK 45" all normalize to "gun".
  let s = raw
    .split(" — ")[0] // our "Name — Category" form
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[^\x00-\x7f]/g, "") // Tamil text
    .split(" - ")[0] // "English - Tamil" rows
    .toLowerCase()
    .replace(/\([^)]*\bpcs?\b[^)]*\)/g, " ") // "(5 Pcs)" quantity notes
    .replace(/\b\d+\s*pcs?\b/g, " ")
    .replace(/lakshmi/g, "laxmi")
    .replace(/permium/g, "premium")
    .replace(/dixier/g, "dixie")
    .replace(/alladin/g, "alladdin")
    .replace(/&/g, " and ")
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9.]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return ALIASES[s] ?? s;
}

export function similarity(a: string, b: string): number {
  const bigrams = (x: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < x.length - 1; i++) {
      const g = x.slice(i, i + 2);
      out.set(g, (out.get(g) ?? 0) + 1);
    }
    return out;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  let hits = 0;
  for (const [g, n] of A) hits += Math.min(n, B.get(g) ?? 0);
  const total = Math.max(a.length - 1, 0) + Math.max(b.length - 1, 0);
  return total ? (2 * hits) / total : 0;
}

export function parseSourceNames(html: string): string[] {
  const names: string[] = [];
  const re = /<td class="product-name"><b>([^<]*)<\/b><\/td>[\s\S]*?id="price_\d+"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) names.push(m[1]);
  return names;
}

type Row = { slug: string; name_en: string; status: string };

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Source site returned ${res.status}`);
  const sourceNames = parseSourceNames(await res.text());
  if (sourceNames.length < 100) {
    throw new Error(`Only parsed ${sourceNames.length} products from the source — page layout may have changed; aborting.`);
  }
  const source = new Set(sourceNames.map(normalize));

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: shop, error: shopErr } = await supabase.from("shops").select("id").eq("slug", SHOP_SLUG).single();
  if (shopErr || !shop) throw shopErr ?? new Error("Shop not found");
  const { data, error } = await supabase
    .from("products")
    .select("slug, name_en, status")
    .eq("shop_id", shop.id)
    .neq("status", "archived");
  if (error) throw error;
  const rows = data as Row[];

  const toUnavailable: Row[] = [];
  const toActive: Row[] = [];
  const review: { row: Row; guess: string }[] = [];

  for (const row of rows) {
    if (IGNORE_SLUGS.has(row.slug)) continue;
    const key = normalize(row.name_en);
    if (source.has(key)) {
      if (row.status === "unavailable") toActive.push(row);
      continue;
    }
    if (row.status !== "active") continue;
    let best = { name: "", score: 0 };
    for (const s of source) {
      const score = similarity(key, s);
      if (score > best.score) best = { name: s, score };
    }
    if (best.score >= 0.8) review.push({ row, guess: best.name });
    else toUnavailable.push(row);
  }

  console.log(`Source: ${sourceNames.length} products. Ours: ${rows.length} (non-archived).\n`);
  const list = (title: string, items: Row[]) => {
    console.log(`${title} (${items.length})`);
    for (const r of items) console.log(`  - ${r.name_en}  [${r.slug}]`);
    console.log();
  };
  list("Not on owner's site -> mark UNAVAILABLE", toUnavailable);
  list("Back on owner's site -> mark ACTIVE", toActive);
  console.log(`Possible renames, NOT changed — check by hand (${review.length})`);
  for (const { row, guess } of review) console.log(`  - ${row.name_en}  ~  "${guess}"  [${row.slug}]`);
  console.log("\nIf a rename is correct, add it to ALIASES in this script.\n");

  const sql = (status: string, items: Row[]) =>
    `update products p set status = '${status}', updated_at = now()
from shops s
where s.id = p.shop_id and s.slug = '${SHOP_SLUG}'
  and p.slug in (${items.map((r) => `'${r.slug}'`).join(", ")});`;
  if (!toUnavailable.length && !toActive.length) console.log("-- Nothing to change.");
  if (toUnavailable.length) console.log(sql("unavailable", toUnavailable) + "\n");
  if (toActive.length) console.log(sql("active", toActive) + "\n");
}

if (process.argv[1]?.endsWith("sync-sri-ram-availability.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
