import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
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

  console.log(`Found shop: ${shop.name_en} (${shop.id})`);

  // Fetch all discountable products for this shop
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name_en, mrp, price, discount_percent, is_discountable")
    .eq("shop_id", shop.id)
    .eq("is_discountable", true);

  if (prodErr || !products) {
    console.error("Failed to fetch products:", prodErr);
    process.exit(1);
  }

  console.log(`Found ${products.length} discountable products.`);

  let updatedCount = 0;

  for (const product of products) {
    if (product.price == null) {
      console.log(`Skipping ${product.name_en} (no current price)`);
      continue;
    }

    // Logic: Old selling price becomes the new MRP, and we apply a 70% discount
    const newMrp = product.price;
    const newDiscountPercent = 70;

    // The database trigger 'products_compute_price' will automatically 
    // calculate the new selling price as: round(newMrp * (100 - 70) / 100)

    const { error: updateErr } = await supabase
      .from("products")
      .update({
        mrp: newMrp,
        discount_percent: newDiscountPercent,
      })
      .eq("id", product.id);

    if (updateErr) {
      console.error(`Failed to update ${product.name_en}:`, updateErr);
    } else {
      updatedCount++;
      const expectedNewPrice = Math.round(newMrp * 0.30);
      console.log(`Updated ${product.name_en}: MRP ${product.mrp} -> ${newMrp}, Price ${product.price} -> ~${expectedNewPrice}`);
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} products.`);
}

main().catch(console.error);
