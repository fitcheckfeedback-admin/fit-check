import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FitCardData, buildCaption } from "@/lib/fitCardCaption";
import { formatHashtagsForShare } from "@/lib/fitCardHashtags";
import { FitCardPreview } from "./FitCardPreview";
import { Button } from "./ui/button";
import { Share2, Copy, MessageCircle, Infinity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportFitCard } from "@/lib/fitCardCanvas";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "./ui/spinner";

interface FitCardShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FitCardData | null;
}

export function FitCardShareSheet({ open, onOpenChange, data }: FitCardShareSheetProps) {
  const { toast } = useToast();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open && data) {
      exportFitCard(data).then(setBlob).catch(console.error);
    } else {
      setBlob(null);
    }
  }, [open, data]);

  if (!data) return null;

  const caption = buildCaption(data, data.hashtags);
  const encodedText = encodeURIComponent(caption);
  const encodedURL = encodeURIComponent(window.location.href);

  const handleNativeShare = async () => {
    try {
      const shareData: ShareData = {
        title: "Fit Check",
        text: caption,
        url: window.location.href
      };

      if (blob && navigator.canShare) {
        const file = new File([blob], "fitcard.jpg", { type: "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);
    } catch (e) {
      console.error("Error sharing", e);
    }
  };

  const handleSaveImage = async () => {
    if (!blob) {
      setIsExporting(true);
      try {
        const b = await exportFitCard(data);
        setBlob(b);
        triggerDownload(b);
      } catch (e) {
        toast({ title: "Failed to save image", variant: "destructive" });
      } finally {
        setIsExporting(false);
      }
    } else {
      triggerDownload(blob);
    }
  };

  const triggerDownload = (b: Blob) => {
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitcheck-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Image saved!" });
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({ title: "Caption copied!" });
  };

  const copyHashtags = () => {
    navigator.clipboard.writeText(formatHashtagsForShare(data.hashtags));
    toast({ title: "Hashtags copied!" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] p-0 flex flex-col bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 pb-2 text-center relative">
          <SheetTitle className="text-2xl font-display font-bold">Share Fit Card</SheetTitle>
          <p className="text-sm text-muted-foreground">Share your daily fit with the world.</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="relative"
            >
              <FitCardPreview data={data} />
            </motion.div>
          </AnimatePresence>

          <Button 
            className="w-full rounded-2xl h-12 font-bold" 
            variant="secondary"
            onClick={handleSaveImage}
            disabled={isExporting}
          >
            {isExporting ? <Spinner className="w-5 h-5" /> : "Save Image"}
          </Button>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Hashtags</h3>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={copyHashtags}>
                Copy all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.hashtags.map(t => (
                <span key={t} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 pb-8">
            <h3 className="text-sm font-bold text-foreground">Share to</h3>
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x">
              <ShareButton 
                icon={<Share2 className="w-6 h-6 text-white" />} 
                label="Share" 
                bg="bg-blue-500" 
                onClick={handleNativeShare} 
              />
              <ShareButton 
                icon={<div className="font-bold text-2xl text-white">𝕏</div>} 
                label="X" 
                bg="bg-black dark:bg-zinc-800" 
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`)} 
              />
              <ShareButton 
                icon={<div className="font-bold text-3xl text-white font-serif -mt-1">f</div>} 
                label="Facebook" 
                bg="bg-[#1877F2]" 
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedURL}&quote=${encodedText}`)} 
              />
              <ShareButton 
                icon={<Infinity className="w-6 h-6 text-white" />} 
                label="Threads" 
                bg="bg-black dark:bg-zinc-800" 
                onClick={() => window.open(`https://www.threads.net/intent/post?text=${encodedText}`)} 
              />
              <ShareButton 
                icon={<MessageCircle className="w-6 h-6 text-white" />} 
                label="WhatsApp" 
                bg="bg-[#25D366]" 
                onClick={() => window.open(`https://wa.me/?text=${encodedText}`)} 
              />
              <ShareButton 
                icon={<div className="font-bold text-2xl text-white font-serif">P</div>} 
                label="Pinterest" 
                bg="bg-[#E60023]" 
                onClick={() => window.open(`https://pinterest.com/pin/create/button/?url=${encodedURL}&description=${encodedText}`)} 
              />
              <ShareButton 
                icon={<Copy className="w-5 h-5 text-foreground" />} 
                label="Copy" 
                bg="bg-muted" 
                onClick={copyCaption} 
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShareButton({ icon, label, bg, onClick }: { icon: React.ReactNode, label: string, bg: string, onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 snap-start shrink-0">
      <button 
        onClick={onClick}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 transition-transform active:scale-95 ${bg}`}
      >
        {icon}
      </button>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}
