import Stripe from "stripe";

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  if (hostname && xReplitToken) {
    try {
      const url = new URL(`https://${hostname}/api/v2/connection`);
      url.searchParams.set("include_secrets", "true");
      url.searchParams.set("connector_names", "stripe");
      url.searchParams.set("environment", targetEnvironment);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "X-Replit-Token": xReplitToken,
        },
      });

      const data = await response.json();
      const connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.secret) {
        return {
          publishableKey: connectionSettings.settings.publishable as string,
          secretKey: connectionSettings.settings.secret as string,
        };
      }
    } catch {
      // fall through to env-var fallback
    }
  }

  // Fall back to env vars (set via Replit Secrets)
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (secretKey && publishableKey) {
    return { secretKey, publishableKey };
  }

  throw new Error("Stripe credentials not configured");
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export async function getStripeSync() {
  const { StripeSync } = await import("stripe-replit-sync");
  const secretKey = await getStripeSecretKey();
  return new StripeSync({
    poolConfig: {
      connectionString: process.env.DATABASE_URL!,
      max: 2,
    },
    stripeSecretKey: secretKey,
  });
}
