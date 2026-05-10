import Stripe from "stripe";
import { getUncachableStripeClient } from "./stripeClient";
import { db, premiumAccessTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripe = getUncachableStripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const deviceId: string | undefined = session.metadata?.deviceId;
        if (deviceId) {
          await db
            .insert(premiumAccessTable)
            .values({ deviceId, note: `Stripe checkout ${session.id}` })
            .onConflictDoNothing();
          logger.info({ deviceId, sessionId: session.id }, "Pro granted via Stripe checkout");
        }
      }

      if (
        event.type === "customer.subscription.deleted" ||
        event.type === "customer.subscription.updated"
      ) {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.status !== "active" && sub.status !== "trialing") {
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const customer = await stripe.customers.retrieve(customerId);
          if (customer.deleted) return;
          const deviceId: string | undefined = (customer as Stripe.Customer).metadata?.deviceId;
          if (deviceId) {
            await db
              .delete(premiumAccessTable)
              .where(eq(premiumAccessTable.deviceId, deviceId));
            logger.info({ deviceId, subId: sub.id, status: sub.status }, "Pro revoked — subscription ended");
          }
        }
      }
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Error handling Stripe event");
    }
  }
}
