import { ReactNode, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, Sparkles, ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { isNative } from "@/lib/platform";
import { Browser } from "@capacitor/browser";
import { purchasePro, restorePurchases } from "@/lib/revenuecat";

interface ProGateProps {
  children: ReactNode;
  feature?: string;
  description?: string;
}

const PRO_GATING_ENABLED = true;

const PRO_FEATURES = [
  "AI Stylist",
  "Trip Planner",
  "Shop the Gap",
  "Unlimited Closet",
  "Voice Assistant",
  "Favorite Outfits",
];

async function startStripeCheckout(deviceId: string): Promise<string | null> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) return null;
  const { url } = await res.json();
  return url ?? null;
}

async function verifyStripePayment(deviceId: string): Promise<boolean> {
  const res = await fetch("/api/stripe/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) return false;
  const { isPro } = await res.json();
  return isPro === true;
}

export function ProGate({ children, feature = "Pro Feature", description }: ProGateProps) {
  const { isPro, loading, refetch } = usePremium();
  const [checkingOut, setCheckingOut] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const awaitingReturnRef = useRef(false);

  useEffect(() => {
    if (isNative()) return;
    function onVisible() {
      if (!awaitingReturnRef.current) return;
      awaitingReturnRef.current = false;
      const deviceId = localStorage.getItem("fitcheck.deviceId");
      if (!deviceId) return;
      setVerifying(true);
      verifyStripePayment(deviceId).then(paid => {
        if (paid) {
          window.location.reload();
        } else {
          setHint("Didn't complete checkout? Tap 'Already paid?' below once you're done.");
          setVerifying(false);
        }
      }).catch(() => setVerifying(false));
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (!PRO_GATING_ENABLED) return <>{children}</>;
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isPro) return <>{children}</>;

  async function handleUpgrade() {
    setError(null);
    setHint(null);

    if (isNative()) {
      setCheckingOut(true);
      try {
        const result = await purchasePro();
        if (result.success) {
          refetch();
        } else if (!result.cancelled) {
          setError(result.error ?? "Purchase failed. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    const deviceId = localStorage.getItem("fitcheck.deviceId");
    if (!deviceId) {
      setError("Could not identify your device. Please reload and try again.");
      return;
    }
    setCheckingOut(true);
    try {
      const url = await startStripeCheckout(deviceId);
      if (url) {
        awaitingReturnRef.current = true;
        await Browser.open({ url });
      } else {
        setError("Checkout unavailable right now. Try again in a moment.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  async function handleRestore() {
    setError(null);
    setHint(null);

    if (isNative()) {
      setRestoring(true);
      try {
        const restored = await restorePurchases();
        if (restored) {
          refetch();
        } else {
          setError("No previous purchase found for this Apple ID.");
        }
      } catch {
        setError("Restore failed. Please try again.");
      } finally {
        setRestoring(false);
      }
      return;
    }

    const deviceId = localStorage.getItem("fitcheck.deviceId");
    if (!deviceId) return;
    setVerifying(true);
    try {
      const paid = await verifyStripePayment(deviceId);
      if (paid) {
        window.location.reload();
      } else {
        setError("No active subscription found.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const busy = checkingOut || verifying || restoring;

  return (
    <div className="flex-1 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <div className="opacity-30 pointer-events-none select-none blur-sm">
          {children}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[320px] bg-card border border-border rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-card">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1.5">FIT✔️ Pro</p>
              <h2 className="text-xl font-black leading-tight mb-2">{feature}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description ?? "Upgrade to unlock smarter styling, AI advice, trip planning, and more."}
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-1.5">
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-left">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground/80">{f}</span>
                </div>
              ))}
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={handleUpgrade}
                disabled={busy}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-base px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-transform disabled:opacity-70"
              >
                {(checkingOut || verifying) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {checkingOut ? "Loading…" : verifying ? "Verifying…" : "Upgrade to Pro"}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {(error || hint) && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-[11px] text-center ${error ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {error ?? hint}
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="text-[11px] text-muted-foreground">
                {isNative() ? "Cancel anytime · Managed by Apple" : "Cancel anytime · Secure checkout via Stripe"}
              </p>

              <button
                onClick={handleRestore}
                disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60 py-1"
              >
                {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                {isNative() ? "Restore purchases" : "Already paid?"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
