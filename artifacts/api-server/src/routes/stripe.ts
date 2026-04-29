import { Router } from "express";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import { db, premiumAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/stripe/publishable-key — return publishable key for frontend Stripe.js
router.get("/stripe/publishable-key", async (_req, res) => {
  try {
    const key = await getStripePublishableKey();
    res.json({ publishableKey: key });
  } catch (err) {
    logger.error({ err }, "Failed to get publishable key");
    res.status(500).json({ error: "Stripe not configured" });
  }
});

// POST /api/stripe/checkout — create a Stripe Checkout session for Pro subscription
router.post("/stripe/checkout", async (req, res) => {
  try {
    const { deviceId, priceId } = req.body as { deviceId?: string; priceId?: string };
    if (!deviceId) {
      res.status(400).json({ error: "deviceId required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    // Find or create a Stripe customer for this device
    const existing = await stripe.customers.search({
      query: `metadata['deviceId']:'${deviceId}'`,
      limit: 1,
    });

    let customerId: string;
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        metadata: { deviceId },
        description: `FIT Check device ${deviceId.slice(0, 8)}`,
      });
      customerId = customer.id;
    }

    // Look up the active monthly Pro price if none specified
    let resolvedPriceId = priceId;
    if (!resolvedPriceId) {
      const products = await stripe.products.search({
        query: "name:'FIT Check Pro' AND active:'true'",
        limit: 1,
      });
      if (products.data.length === 0) {
        res.status(503).json({ error: "Pro plan not configured yet" });
        return;
      }
      const prices = await stripe.prices.list({
        product: products.data[0].id,
        active: true,
        recurring: { interval: "month" } as any,
        limit: 1,
      });
      if (prices.data.length === 0) {
        res.status(503).json({ error: "Pro plan price not configured" });
        return;
      }
      resolvedPriceId = prices.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?pro=success`,
      cancel_url: `${baseUrl}/?pro=cancel`,
      metadata: { deviceId },
      subscription_data: { metadata: { deviceId } },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/stripe/portal — customer portal for managing subscription
router.post("/stripe/portal", async (req, res) => {
  try {
    const { deviceId } = req.body as { deviceId?: string };
    if (!deviceId) {
      res.status(400).json({ error: "deviceId required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const existing = await stripe.customers.search({
      query: `metadata['deviceId']:'${deviceId}'`,
      limit: 1,
    });

    if (existing.data.length === 0) {
      res.status(404).json({ error: "No subscription found for this device" });
      return;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: existing.data[0].id,
      return_url: `${baseUrl}/`,
    });

    res.json({ url: portal.url });
  } catch (err) {
    logger.error({ err }, "Stripe portal error");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// POST /api/stripe/verify — manually verify subscription is still active and sync premium
router.post("/stripe/verify", async (req, res) => {
  try {
    const { deviceId } = req.body as { deviceId?: string };
    if (!deviceId) {
      res.status(400).json({ error: "deviceId required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const existing = await stripe.customers.search({
      query: `metadata['deviceId']:'${deviceId}'`,
      limit: 1,
    });

    if (existing.data.length === 0) {
      res.json({ isPro: false });
      return;
    }

    const subs = await stripe.subscriptions.list({
      customer: existing.data[0].id,
      status: "active",
      limit: 1,
    });

    const isPro = subs.data.length > 0;
    if (isPro) {
      await db
        .insert(premiumAccessTable)
        .values({ deviceId, note: `Stripe verified ${subs.data[0].id}` })
        .onConflictDoNothing();
    }

    res.json({ isPro });
  } catch (err) {
    logger.error({ err }, "Stripe verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
