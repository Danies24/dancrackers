import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Fetching Bullet Crackers data...\n");
  const { data: shop, error: shopErr } = await supabase.from("shops").select("*").ilike("name_en", "%bullet%").single();
  
  if (shopErr || !shop) {
    console.error("Failed to fetch shop.");
    return;
  }

  console.log("--- SHOP CONFIGURATION ---");
  console.log(`Name: ${shop.name_en}`);
  console.log(`Global Shop Markup Percent: ${shop.markup_percent}% (Kolagalam's profit margin)`);
  console.log(`Max Active Discount: ${shop.max_active_discount_percent}%\n`);

  const { data: products } = await supabase
    .from("products")
    .select("name_en, supplier_price, mrp, price, discount_percent, net_markup_percent")
    .eq("shop_id", shop.id)
    .limit(10);
  
  console.log("--- SAMPLE PRODUCTS (How they look right now) ---");
  console.table(products);
}

main().catch(console.error);
