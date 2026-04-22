import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraCapture } from "./CameraCapture";
import { ClosetItem, Category, StylePreference } from "@/lib/storage";
import { useClosetImage } from "@/hooks/useClosetImage";
import { saveImage, deleteImage } from "@/lib/imageStore";
import { Trash2, Camera, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tops", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "shoes", label: "Shoes" },
  { id: "accessories", label: "Accessories" },
];

const STYLES: StylePreference[] = ["Casual", "Streetwear", "Athletic", "Workwear", "Minimal"];

interface ItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ClosetItem | null;
  initialCategory?: Category;
  currentStyle: StylePreference;
  onSave: (item: ClosetItem) => void;
  onDelete: (id: string, category: Category) => void;
}

export function ItemEditor({ open, onOpenChange, item, initialCategory = "tops", currentStyle, onSave, onDelete }: ItemEditorProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [styles, setStyles] = useState<StylePreference[]>([]);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { src: existingImageUrl } = useClosetImage(existingImageId);

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setCategory(item.category);
        setStyles(item.styles);
        setExistingImageId(item.imageId);
      } else {
        setName("");
        setCategory(initialCategory);
        setStyles([currentStyle]);
        setExistingImageId(null);
      }
      setPhotoBlob(null);
      setPreviewUrl(null);
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [open, item, initialCategory, currentStyle]);

  const handleCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const removePhoto = () => {
    setPhotoBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExistingImageId(null);
  };

  const toggleStyle = (style: StylePreference) => {
    setStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style) 
        : [...prev, style]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      let finalImageId = existingImageId;

      if (photoBlob) {
        if (item?.imageId) {
          await deleteImage(item.imageId);
        }
        finalImageId = await saveImage(photoBlob);
      } else if (!existingImageId && item?.imageId) {
        await deleteImage(item.imageId);
      }

      const finalStyles = styles.length > 0 ? styles : [currentStyle];

      const newItem: ClosetItem = {
        id: item?.id || crypto.randomUUID(),
        name: name.trim(),
        category,
        imageId: finalImageId,
        styles: finalStyles,
        createdAt: item?.createdAt || Date.now()
      };

      onSave(newItem);
      onOpenChange(false);
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setIsSaving(false);
    }
  };

  const currentDisplayUrl = previewUrl || existingImageUrl;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left pb-2 border-b border-border/40">
          <DrawerTitle className="font-display text-2xl">{item ? "Edit Item" : "Add Item"}</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto overflow-x-hidden space-y-6 pb-24">
          {/* Photo Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Photo</label>
            <div className="flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                {currentDisplayUrl ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full aspect-square max-w-[240px] rounded-3xl overflow-hidden border-2 border-border shadow-sm group"
                  >
                    <img src={currentDisplayUrl} alt="Item" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <CameraCapture onCapture={handleCapture} variant="secondary" className="rounded-xl">
                        <Camera className="w-4 h-4 mr-2" /> Retake
                      </CameraCapture>
                      <Button variant="destructive" size="icon" onClick={removePhoto} className="rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full aspect-square max-w-[240px] rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <CameraCapture onCapture={handleCapture} className="rounded-xl shadow-sm">
                      <Camera className="w-4 h-4 mr-2" /> Take Photo
                    </CameraCapture>
                    <span className="text-xs text-muted-foreground font-medium">or pick from gallery</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Black hoodie" 
                className="h-14 rounded-2xl text-base bg-card shadow-sm border-2"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      category === c.id 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border/50 bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Vibes (Styles)</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                      styles.includes(style)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 bg-card text-foreground/70 hover:border-foreground/30"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-2 border-t border-border/40 gap-3 bg-background z-10 pb-8">
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isSaving}
            className="h-14 rounded-2xl text-base font-bold shadow-sm"
          >
            {isSaving ? "Saving..." : "Save Item"}
          </Button>
          
          {item && (
            <Button 
              variant="destructive" 
              onClick={() => {
                onDelete(item.id, item.category);
                onOpenChange(false);
              }}
              className="h-14 rounded-2xl text-base font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-0"
            >
              Delete Item
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
