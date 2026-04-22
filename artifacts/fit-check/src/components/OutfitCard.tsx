import { Recommendation } from "@/lib/recommend";
import { FitScoreBadge } from "./FitScoreBadge";
import { AlertTriangle, Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { WeatherTag } from "@/lib/storage";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "./ui/label";
import { trackEvent } from "@/lib/analytics";

interface OutfitCardProps {
  recommendation: Recommendation;
  weatherTags?: WeatherTag[];
}

export function OutfitCard({ recommendation, weatherTags = [] }: OutfitCardProps) {
  const { mainOutfit, outerwear, accessories, warnings, fitScore } = recommendation;
  const { settings, updateSettings } = useFitCheckSettings();
  const { toast } = useToast();
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fitLabel, setFitLabel] = useState("");

  const savedFitMatch = settings.savedFits?.find(f => f.mainOutfit === mainOutfit && f.outerwear === outerwear);
  const isSaved = !!savedFitMatch;

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open && !isSaved) {
      setFitLabel(mainOutfit.slice(0, 30));
    }
  };

  const handleSave = () => {
    if (!fitLabel.trim()) return;
    const newFit = {
      id: crypto.randomUUID(),
      label: fitLabel,
      mainOutfit,
      outerwear,
      accessories,
      style: settings.style,
      fitScore,
      weatherTags,
      savedAt: Date.now()
    };
    const currentFits = settings.savedFits || [];
    updateSettings({ savedFits: [newFit, ...currentFits] });
    setPopoverOpen(false);
    toast({ title: "Fit saved!", description: "Added to your saved combos." });
    trackEvent("fit_saved", { style: settings.style, fitScore });
  };

  const handleUnsave = () => {
    if (!savedFitMatch) return;
    updateSettings({
      savedFits: settings.savedFits.filter(f => f.id !== savedFitMatch.id)
    });
    setPopoverOpen(false);
    toast({ title: "Fit removed", description: "Removed from saved combos." });
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-2 border-primary/20 relative overflow-hidden group hover:border-primary/50 transition-colors">
      {/* Decorative gradient blur based on score */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-50" />

      <div className="absolute top-5 right-5 flex items-center gap-2">
        <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-md hover:bg-background/90 transition-colors shadow-sm text-primary">
              {isSaved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 rounded-2xl border-2" align="end">
            {!isSaved ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name this fit</Label>
                  <Input 
                    id="fit-name"
                    value={fitLabel} 
                    onChange={e => setFitLabel(e.target.value)} 
                    className="mt-1.5 h-9"
                    autoFocus
                  />
                </div>
                <Button size="sm" className="w-full font-bold" onClick={handleSave}>Save Fit</Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm font-semibold">Remove this saved fit?</p>
                <Button variant="destructive" size="sm" className="w-full font-bold" onClick={handleUnsave}>Unsave</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <FitScoreBadge score={fitScore} />
      </div>
      
      <div className="space-y-6 pt-2">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            The Fit
          </h3>
          <p className="text-2xl font-display font-semibold leading-tight pr-24 text-foreground/90">
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