import { Recommendation } from "@/lib/recommend";
import { FitScoreBadge } from "./FitScoreBadge";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface OutfitCardProps {
  recommendation: Recommendation;
}

export function OutfitCard({ recommendation }: OutfitCardProps) {
  const { mainOutfit, outerwear, accessories, warnings, fitScore } = recommendation;

  return (
    <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-2 border-primary/20 relative overflow-hidden group hover:border-primary/50 transition-colors">
      {/* Decorative gradient blur based on score */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-50" />

      <div className="absolute top-5 right-5">
        <FitScoreBadge score={fitScore} />
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            The Fit
          </h3>
          <p className="text-2xl font-display font-semibold leading-tight pr-14 text-foreground/90">
            {mainOutfit}
          </p>
        </div>

        {outerwear && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Layer Up
            </h3>
            <p className="text-lg font-medium text-foreground/80">
              {outerwear}
            </p>
          </div>
        )}

        {accessories.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Extras
            </h3>
            <div className="flex flex-wrap gap-2">
              {accessories.map((acc, i) => (
                <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground border border-border/50 rounded-xl text-sm font-semibold shadow-sm">
                  {acc}
                </span>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 pt-5 border-t border-border/40 space-y-2.5">
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-2xl">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold leading-snug">{warning}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
