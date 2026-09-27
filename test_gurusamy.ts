import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // First, find the shop ID for gurusamy
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, name")
    .eq("slug", "gurusamy-fireworks")
    .single();
    
  if (shopErr) {
    console.error("Shop error:", shopErr);
    return;
  }
  
  console.log("Shop:", shop);
  
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name_en, mrp, price")
    .eq("shop_id", shop.id)
    .limit(5);
    
  if (error) {
    console.error("Products error:", error);
    return;
  }
  
  console.log("Sample products:", products);
}

run();
