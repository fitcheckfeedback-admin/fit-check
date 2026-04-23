import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, AlertTriangle, Shirt, Footprints, Gem } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { FitScoreBadge } from "./FitScoreBadge";
import { Recommendation } from "@/lib/recommend";
import { WeatherTag, ClosetItem } from "@/lib/storage";
import { ClosetMatchResult } from "@/lib/closetMatch";
import { useClosetImage } from "@/hooks/useClosetImage";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { JacketIcon } from "./icons/JacketIcon";
import { PantsIcon } from "./icons/PantsIcon";

function buildClosetDescription(match: ClosetMatchResult): string | null {
  const { outerwear, tops, bottoms, shoes } = match;
  const hasAny = outerwear || tops || bottoms || shoes;
  if (!hasAny) return null;

  if (outerwear && tops && bottoms) {
    let desc = `Your ${outerwear.name} over your ${tops.name}, with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (outerwear && bottoms && !tops) {
    let desc = `Your ${outerwear.name} with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (outerwear && tops && !bottoms) {
    let desc = `Your ${outerwear.name} over your ${tops.name}`;
    if (shoes) desc += ` with your ${shoes.name}`;
    return desc;
  }

  if (tops && bottoms) {
    let desc = `Your ${tops.name} with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (tops && shoes) {
    return `Your ${tops.name} with your ${shoes.name}`;
  }

  if (bottoms && shoes) {
    return `Your ${bottoms.name} with your ${shoes.name}`;
  }

  const available = [outerwear, tops, bottoms, shoes].filter(Boolean);
  if (available.length === 1) return `Your ${available[0]!.name}`;
  return available.map(i => `your ${i!.name}`).join(", ");
}

interface SlotProps {
  item: ClosetItem | undefined;
  label: string;
  icon: React.ElementType;
  tall?: boolean;
}

function ItemSlot({ item, label, icon: Icon, tall }: SlotProps) {
  const { src } = useClosetImage(item?.imageId ?? null);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-border/30 flex items-center justify-center ${tall ? "row-span-2" : ""}`}>
      {src ? (
        <img
          src={src}
          alt={item?.name ?? label}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 opacity-25">
          <Icon className="w-7 h-7" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{label}</span>
        </div>
      )}
      {item && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/30 to-transparent">
          <p className="text-[9px] font-bold text-white truncate leading-tight">{item.name}</p>
        </div>
      )}
    </div>
  );
}

interface OutfitLookCardProps {
  recommendation: Recommendation;
  closetMatch: ClosetMatchResult;
  weatherTags?: WeatherTag[];
}

export function OutfitLookCard({ recommendation, closetMatch, weatherTags = [] }: OutfitLookCardProps) {
  const { mainOutfit, outerwear, accessories, warnings, fitScore } = recommendation;
  const closetDesc = buildClosetDescription(closetMatch);
  const { settings, updateSettings } = useFitCheckSettings();
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fitLabel, setFitLabel] = useState("");

  const savedFitMatch = settings.savedFits?.find(
    f => f.mainOutfit === mainOutfit && f.outerwear === outerwear
  );
  const isSaved = !!savedFitMatch;

  const hasAnyPhoto = [
    closetMatch.tops,
    closetMatch.bottoms,
    closetMatch.outerwear,
    closetMatch.shoes,
    closetMatch.accessories,
  ].some(item => item?.imageId);

  const handleOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open && !isSaved) setFitLabel(mainOutfit.slice(0, 30));
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
      savedAt: Date.now(),
    };
    updateSettings({ savedFits: [newFit, ...(settings.savedFits || [])] });
    setPopoverOpen(false);
    toast({ title: "Fit saved!", description: "Added to your saved combos." });
    trackEvent("fit_saved", { style: settings.style, fitScore });
  };

  const handleUnsave = () => {
    if (!savedFitMatch) return;
    updateSettings({
      savedFits: settings.savedFits.filter(f => f.id !== savedFitMatch.id),
    });
    setPopoverOpen(false);
    toast({ title: "Fit removed", description: "Removed from saved combos." });
  };

  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-border/40">

      {/* ── Visual flat-lay ── */}
      <div className="relative p-3 pb-2">
        {hasAnyPhoto ? (
          <div className="grid grid-cols-2 gap-2" style={{ gridTemplateRows: "160px 140px" }}>
            {/* Top-left: outerwear if present, else top */}
            <ItemSlot
              item={closetMatch.outerwear ?? closetMatch.tops}
              label={closetMatch.outerwear ? "Layer" : "Top"}
              icon={closetMatch.outerwear ? JacketIcon : Shirt}
            />
            {/* Top-right: top if outerwear is top-left, else outerwear or shoes */}
            <ItemSlot
              item={closetMatch.outerwear ? closetMatch.tops : closetMatch.shoes}
              label={closetMatch.outerwear ? "Top" : "Shoes"}
              icon={closetMatch.outerwear ? Shirt : Footprints}
            />
            {/* Bottom-left: bottoms */}
            <ItemSlot item={closetMatch.bottoms} label="Bottom" icon={PantsIcon} />
            {/* Bottom-right: shoes if outerwear used top-left, else accessories or shoes */}
            <ItemSlot
              item={closetMatch.outerwear ? closetMatch.shoes : closetMatch.accessories}
              label={closetMatch.outerwear ? "Shoes" : "Accessory"}
              icon={closetMatch.outerwear ? Footprints : Gem}
            />
          </div>
        ) : (
          /* No photos — show a styled text hero */
          <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15 p-5 min-h-[120px] flex flex-col justify-center">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-2">Today's Fit</p>
            <p className="text-2xl font-display font-semibold leading-snug text-foreground/90">
              {closetDesc ?? mainOutfit}
            </p>
            {!closetDesc && outerwear && (
              <p className="text-sm text-muted-foreground mt-2 font-medium">+ {outerwear}</p>
            )}
          </div>
        )}

        {/* Fit score + save — floating top-right */}
        <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
          <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-sm text-primary border border-border/20">
                {isSaved ? <BookmarkCheck className="w-4.5 h-4.5 fill-current" /> : <Bookmark className="w-4.5 h-4.5" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 rounded-2xl border-2" align="end">
              {!isSaved ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name this fit</Label>
                    <Input id="fit-name" value={fitLabel} onChange={e => setFitLabel(e.target.value)} className="mt-1.5 h-9" autoFocus />
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
      </div>

      {/* ── Text summary ── */}
      {hasAnyPhoto && (
        <div className="px-4 pb-4 space-y-3">
          <div className="pt-1 border-t border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 mt-2">The Fit</p>
            <p className="text-base font-display font-semibold leading-snug text-foreground/90">
              {closetDesc ?? mainOutfit}
            </p>
            {!closetDesc && outerwear && (
              <p className="text-sm text-muted-foreground mt-1">+ {outerwear}</p>
            )}
          </div>

          {accessories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {accessories.map((acc, i) => (
                <span key={i} className="px-2.5 py-1 bg-secondary text-secondary-foreground border border-border/40 rounded-lg text-xs font-semibold">
                  {acc}
                </span>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/8 p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-snug">{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings for text-only mode */}
      {!hasAnyPhoto && warnings.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-500/8 p-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-snug">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
