import { getShopsForHomeShowcase } from "../lib/shops";

async function main() {
  const cards = await getShopsForHomeShowcase();
  for (const card of cards) {
    console.log(`\nShop: ${card.shop.name_en}`);
    card.topProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name_en} - ₹${p.price}`);
    });
  }
}

main().catch(console.error);
