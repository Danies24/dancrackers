import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching Gurusamy shop...");
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, name_en")
    .eq("slug", "gurusamy-fireworks")
    .single();

  if (shopErr || !shop) {
    console.error("Failed to fetch Gurusamy shop:", shopErr);
    process.exit(1);
  }

  // Reset all featured flags for this shop
  await supabase.from("products").update({ is_featured: false }).eq("shop_id", shop.id);

  // The products to feature
  const queries = [
    "Flower Pots Deluxe",
    "Ground Chakkar Deluxe",
    "Atom Bomb", // Guessing they mean Atom Bomb or Classic Bomb
    "Golden Phoenix 25",
    "Twinkling Star"
  ];

  for (const query of queries) {
    const { data: matches } = await supabase
      .from("products")
      .select("id, name_en")
      .eq("shop_id", shop.id)
      .ilike("name_en", `%${query}%`)
      .limit(1);
      
    if (matches && matches.length > 0) {
      console.log(`Featuring: ${matches[0].name_en}`);
      await supabase.from("products").update({ is_featured: true }).eq("id", matches[0].id);
    } else {
      console.log(`Not found for: ${query}, trying just "Bomb"`);
      if (query === "Atom Bomb") {
        const { data: bombMatches } = await supabase
          .from("products")
          .select("id, name_en")
          .eq("shop_id", shop.id)
          .ilike("name_en", `%bomb%`)
          .limit(1);
        if (bombMatches && bombMatches.length > 0) {
           console.log(`Featuring: ${bombMatches[0].name_en}`);
           await supabase.from("products").update({ is_featured: true }).eq("id", bombMatches[0].id);
        }
      }
    }
  }
  console.log("Done featuring products.");
}

main().catch(console.error);
