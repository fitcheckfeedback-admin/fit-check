import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

interface ProGateProps {
  children: ReactNode;
  feature?: string;
  description?: string;
}

export function ProGate({ children, feature = "Pro Feature", description }: ProGateProps) {
  const { isPro, loading } = usePremium();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Blurred preview of children */}
      <div className="relative flex-1 overflow-hidden">
        <div className="opacity-30 pointer-events-none select-none blur-sm">
          {children}
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[320px] bg-card border border-border rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center gap-4"
          >
            {/* Crown badge */}
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
                {description ?? "This feature is part of FIT✔️ Pro — upgrade to unlock smarter styling, trip planning, and more."}
              </p>
            </div>

            <div className="w-full space-y-2">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-base px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 opacity-60 cursor-not-allowed">
                <Lock className="w-4 h-4" />
                Upgrade to Pro — $2.99/mo
                <ArrowRight className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Coming soon · Early testers get free access
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {["Shop the Gap", "Trip Planner", "Accessory Picks", "Affiliate Deals"].map(f => (
                <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
