import { getStripeSync } from "./stripeClient";
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

    const sync = await getStripeSync();
    const event = await sync.processWebhook(payload, signature);

    if (!event) return;

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
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
        const sub = event.data.object as any;
        if (sub.status !== "active" && sub.status !== "trialing") {
          const customerId: string = sub.customer;
          const stripe = (await import("./stripeClient")).getUncachableStripeClient;
          const stripeClient = await stripe();
          const customer = await stripeClient.customers.retrieve(customerId);
          if (customer.deleted) return;
          const deviceId: string | undefined = (customer as any).metadata?.deviceId;
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
