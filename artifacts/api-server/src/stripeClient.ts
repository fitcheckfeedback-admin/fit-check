import Stripe from "stripe";

function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    throw new Error(
      "STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in environment variables"
    );
  }
  return { secretKey, publishableKey };
}

export function getUncachableStripeClient(): Stripe {
  const { secretKey } = getCredentials();
  return new Stripe(secretKey, { apiVersion: "2025-08-27.basil" as any });
}

export function getStripePublishableKey(): string {
  return getCredentials().publishableKey;
}

export function getStripeSecretKey(): string {
  return getCredentials().secretKey;
}
