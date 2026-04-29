import { getUncachableStripeClient } from "./stripeClient";

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Checking for existing FIT Check Pro product...");
  const existing = await stripe.products.search({
    query: "name:'FIT Check Pro' AND active:'true'",
    limit: 1,
  });

  if (existing.data.length > 0) {
    const prod = existing.data[0];
    console.log(`Product already exists: ${prod.id} (${prod.name})`);
    const prices = await stripe.prices.list({ product: prod.id, active: true });
    for (const p of prices.data) {
      console.log(`  Price: ${p.id} — $${(p.unit_amount ?? 0) / 100}/${(p.recurring as any)?.interval}`);
    }
    return;
  }

  console.log("Creating FIT Check Pro product...");
  const product = await stripe.products.create({
    name: "FIT Check Pro",
    description: "Unlock AI Stylist, Trip Planner, Shop the Gap, unlimited closet, and more.",
    metadata: { app: "fitcheck", plan: "pro" },
  });
  console.log(`Created product: ${product.id}`);

  const monthly = await stripe.prices.create({
    product: product.id,
    unit_amount: 299,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Pro Monthly",
  });
  console.log(`Created monthly price: ${monthly.id} — $2.99/mo`);

  const yearly = await stripe.prices.create({
    product: product.id,
    unit_amount: 2499,
    currency: "usd",
    recurring: { interval: "year" },
    nickname: "Pro Yearly",
  });
  console.log(`Created yearly price: ${yearly.id} — $24.99/yr`);

  console.log("\nDone! Copy these IDs if needed:");
  console.log(`  Product: ${product.id}`);
  console.log(`  Monthly price: ${monthly.id}`);
  console.log(`  Yearly price:  ${yearly.id}`);
}

seedProducts().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
