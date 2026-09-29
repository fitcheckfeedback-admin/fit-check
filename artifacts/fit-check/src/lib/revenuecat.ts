import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { isNative } from "@/lib/platform";

const REVENUECAT_APPLE_KEY = "appl_PvxOIGsrrSneLjdYjNxVlBuGFzV";
const PRO_ENTITLEMENT = "pro";

let initialized = false;

export async function initRevenueCat(): Promise<void> {
  if (!isNative() || initialized) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
    initialized = true;
  } catch (e) {
    console.error("RevenueCat init failed", e);
  }
}

export async function getRCProStatus(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return PRO_ENTITLEMENT in customerInfo.entitlements.active;
  } catch {
    return false;
  }
}

/** Returns the current Pro offering's display price (e.g. "$2.99") from RevenueCat. */
export async function getProOffering(): Promise<{ priceString: string } | null> {
  if (!isNative()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    if (!pkg) return null;
    return { priceString: pkg.product.priceString };
  } catch {
    return null;
  }
}

export async function purchasePro(): Promise<{
  success: boolean;
  cancelled?: boolean;
  error?: string;
}> {
  if (!isNative()) return { success: false, error: "Not on iOS" };
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current || current.availablePackages.length === 0) {
      return { success: false, error: "No subscription available right now. Please try again later." };
    }
    const pkg = current.availablePackages[0];
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    let isPro = PRO_ENTITLEMENT in customerInfo.entitlements.active;
    if (!isPro) {
      // The entitlement can lag a few seconds behind a completed purchase.
      // Poll briefly before telling the user anything went wrong.
      for (let i = 0; i < 3 && !isPro; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
          const { customerInfo: refreshed } = await Purchases.getCustomerInfo();
          isPro = PRO_ENTITLEMENT in refreshed.entitlements.active;
        } catch {
          // Keep polling; a transient network blip shouldn't fail the purchase.
        }
      }
    }
    if (isPro) return { success: true };
    return {
      success: false,
      error: "Purchase completed, but we couldn't confirm your Pro status yet. Your receipt is safe — tap \"Restore purchases\" and it will unlock.",
    };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    const message = typeof e?.message === "string" && e.message.trim().length > 0
      ? e.message
      : "Purchase failed. Please try again.";
    return { success: false, error: message };
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return PRO_ENTITLEMENT in customerInfo.entitlements.active;
  } catch {
    return false;
  }
}
