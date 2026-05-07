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
    const isPro = PRO_ENTITLEMENT in customerInfo.entitlements.active;
    return { success: isPro };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    return { success: false, error: "Purchase failed. Please try again." };
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
