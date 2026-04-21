import { Recommendation } from "@/lib/recommend";
import { FitScoreBadge } from "./FitScoreBadge";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface OutfitCardProps {
  recommendation: Recommendation;
}

export function OutfitCard({ recommendation }: OutfitCardProps) {
  const { mainOutfit, outerwear, accessories, warnings, fitScore } = recommendation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-3xl p-6 border border-border bg-card shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <FitScoreBadge score={fitScore} />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Main Fit
            </h3>
            <p className="text-xl font-medium leading-snug pr-12">
              {mainOutfit}
            </p>
          </div>

          {outerwear && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Outerwear
              </h3>
              <p className="text-lg text-foreground/90">
                {outerwear}
              </p>
            </div>
          )}

          {accessories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Accessories
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {accessories.map((acc, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              {warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{warning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
