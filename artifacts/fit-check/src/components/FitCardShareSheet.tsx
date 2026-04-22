import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FitCardData, buildCaption } from "@/lib/fitCardCaption";
import { formatHashtagsForShare } from "@/lib/fitCardHashtags";
import { FitCardPreview } from "./FitCardPreview";
import { Button } from "./ui/button";
import { Share2, Copy, MessageCircle, Infinity, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportFitCard } from "@/lib/fitCardCanvas";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FitCardShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FitCardData | null;
}

export function FitCardShareSheet({ open, onOpenChange, data }: FitCardShareSheetProps) {
  const { toast } = useToast();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeData: FitCardData | null = data
    ? { ...data, userPhoto: userPhoto ?? undefined }
    : null;

  // Re-export card whenever photo changes (async, non-blocking)
  useEffect(() => {
    if (open && activeData) {
      exportFitCard(activeData).then(setBlob).catch(console.error);
    } else if (!open) {
      setBlob(null);
    }
  }, [open, userPhoto, data]);

  // Clear photo when sheet closes
  useEffect(() => {
    if (!open) setUserPhoto(null);
  }, [open]);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      // Compress via canvas before storing
      const img = new Image();
      img.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const cx = c.getContext("2d");
        if (cx) {
          cx.drawImage(img, 0, 0, c.width, c.height);
          setUserPhoto(c.toDataURL("image/jpeg", 0.85));
        } else {
          setUserPhoto(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be reselected
    e.target.value = "";
  }, []);

  if (!activeData) return null;

  const caption = buildCaption(activeData, activeData.hashtags);
  const encodedText = encodeURIComponent(caption);
  const encodedURL = encodeURIComponent(window.location.href);

  const handleNativeShare = async () => {
    try {
      const shareData: ShareData = {
        title: "Fit Check",
        text: caption,
        url: window.location.href,
      };
      if (blob && navigator.canShare) {
        const file = new File([blob], "fitcard.jpg", { type: "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      }
      await navigator.share(shareData);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        toast({ title: "Sharing not supported on this browser", variant: "destructive" });
      }
    }
  };

  const handleSaveImage = async () => {
    setIsSaving(true);
    try {
      const b = blob ?? await exportFitCard(activeData);
      if (!blob) setBlob(b);
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitcheck-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Image saved!" });
    } catch {
      toast({ title: "Failed to save image", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({ title: "Caption copied!" });
  };

  const copyHashtags = () => {
    navigator.clipboard.writeText(formatHashtagsForShare(activeData.hashtags));
    toast({ title: "Hashtags copied!" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-[2rem] p-0 flex flex-col bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 pb-2 text-center">
          <SheetTitle className="text-2xl font-display font-bold">Fit Card</SheetTitle>
          <p className="text-sm text-muted-foreground">Share your daily fit with the world.</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={userPhoto ?? "no-photo"}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <FitCardPreview data={activeData} />
            </motion.div>
          </AnimatePresence>

          {/* Photo controls */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {userPhoto ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl h-12 font-semibold gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Change photo
              </Button>
              <Button
                variant="ghost"
                className="rounded-2xl h-12 px-4 text-muted-foreground gap-1.5"
                onClick={() => setUserPhoto(null)}
              >
                <X className="w-4 h-4" />
                Remove
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800 h-16 flex items-center justify-center gap-3 text-amber-700 dark:text-amber-400 font-semibold text-sm transition-colors hover:bg-amber-100/60 dark:hover:bg-amber-900/30 active:scale-[0.98]"
            >
              <Camera className="w-5 h-5" />
              Add a photo of your outfit
            </button>
          )}

          {/* Save image */}
          <Button
            className="w-full rounded-2xl h-12 font-bold"
            variant="secondary"
            onClick={handleSaveImage}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Image"}
          </Button>

          {/* Hashtags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Hashtags</h3>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold" onClick={copyHashtags}>
                Copy all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeData.hashtags.map(t => (
                <span key={t} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Share row */}
          <div className="space-y-4 pb-8">
            <h3 className="text-sm font-bold">Share to</h3>
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
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank")}
              />
              <ShareButton
                icon={<div className="font-bold text-3xl text-white font-serif -mt-1">f</div>}
                label="Facebook"
                bg="bg-[#1877F2]"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedURL}&quote=${encodedText}`, "_blank")}
              />
              <ShareButton
                icon={<Infinity className="w-6 h-6 text-white" />}
                label="Threads"
                bg="bg-black dark:bg-zinc-800"
                onClick={() => window.open(`https://www.threads.net/intent/post?text=${encodedText}`, "_blank")}
              />
              <ShareButton
                icon={<MessageCircle className="w-6 h-6 text-white" />}
                label="WhatsApp"
                bg="bg-[#25D366]"
                onClick={() => window.open(`https://wa.me/?text=${encodedText}`, "_blank")}
              />
              <ShareButton
                icon={<div className="font-bold text-2xl text-white font-serif">P</div>}
                label="Pinterest"
                bg="bg-[#E60023]"
                onClick={() => window.open(`https://pinterest.com/pin/create/button/?url=${encodedURL}&description=${encodedText}`, "_blank")}
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

function ShareButton({ icon, label, bg, onClick }: { icon: React.ReactNode; label: string; bg: string; onClick: () => void }) {
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
