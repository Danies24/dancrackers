import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Fetching Bullet Crackers shop...");
  const { data: shop, error: shopErr } = await supabase.from("shops").select("id").ilike("name_en", "%bullet%").single();
  
  if (shopErr || !shop) {
    console.error("Failed to fetch shop:", shopErr);
    return;
  }

  console.log("Updating shop markup_percent to 5...");
  await supabase.from("shops").update({ markup_percent: 10 }).eq("id", shop.id);

  console.log("Updating all Bullet Crackers products to 5% net_markup_percent...");
  const { data: products, error: prodErr } = await supabase.from("products").update({ net_markup_percent: 10 }).eq("shop_id", shop.id).select("name_en, supplier_price, price").limit(1);

  if (prodErr) {
    console.error("Failed to update products:", prodErr);
  } else {
    console.log("Successfully updated prices! Sample product updated:");
    console.log(products[0]);
  }
}

main().catch(console.error);
