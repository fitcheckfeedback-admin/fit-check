import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import {
  Plus, Shirt, Footprints,
  Image as ImageIcon, Trash2, ArrowLeft, MoreVertical, ChevronRight, Gem
} from "lucide-react";
import { PantsIcon } from "@/components/icons/PantsIcon";
import { JacketIcon } from "@/components/icons/JacketIcon";
import { ClosetItem, Category } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { useClosetImage } from "@/hooks/useClosetImage";
import { ItemEditor } from "@/components/ItemEditor";
import { deleteImage } from "@/lib/imageStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CATEGORIES: {
  id: Category;
  label: string;
  fullLabel: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
  emptyMsg: string;
}[] = [
  {
    id: "tops",
    label: "Tops",
    fullLabel: "Tops & Shirts",
    icon: Shirt,
    bg: "from-amber-400/30 to-amber-600/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    emptyMsg: "Add your favorite shirts and hoodies",
  },
  {
    id: "bottoms",
    label: "Bottoms",
    fullLabel: "Bottoms & Pants",
    icon: PantsIcon,
    bg: "from-sky-400/30 to-sky-600/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    emptyMsg: "Add your jeans, pants, and shorts",
  },
  {
    id: "outerwear",
    label: "Outerwear",
    fullLabel: "Outerwear",
    icon: JacketIcon,
    bg: "from-stone-400/30 to-stone-600/10",
    iconColor: "text-stone-600 dark:text-stone-400",
    emptyMsg: "Add your jackets, coats, and layers",
  },
  {
    id: "shoes",
    label: "Shoes",
    fullLabel: "Shoes",
    icon: Footprints,
    bg: "from-rose-400/30 to-rose-600/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    emptyMsg: "Add your everyday kicks",
  },
  {
    id: "accessories",
    label: "Accessories",
    fullLabel: "Accessories",
    icon: Gem,
    bg: "from-violet-400/30 to-violet-600/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    emptyMsg: "Add hats, bags, scarves, jewelry, and more",
  },
];

// Tiny circular thumbnail used in category card preview strip
function PreviewThumb({ item, style }: { item: ClosetItem; style?: React.CSSProperties }) {
  const { src } = useClosetImage(item.imageId);
  return (
    <div
      className="w-9 h-9 rounded-full border-[2.5px] border-background overflow-hidden bg-muted shrink-0 shadow-sm"
      style={style}
    >
      {src ? (
        <img src={src} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

// Landing category card
function CategoryCard({
  cat,
  items,
  onClick,
}: {
  cat: (typeof CATEGORIES)[0];
  items: ClosetItem[];
  onClick: () => void;
}) {
  const Icon = cat.icon;
  const preview = items.slice(0, 4);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative flex flex-col items-start justify-between w-full rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm p-5 min-h-[170px] text-left"
    >
      {/* Gradient backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} pointer-events-none`} />

      <div className="relative w-full flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-background/70 backdrop-blur-sm flex items-center justify-center shadow-sm ${cat.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 bg-background/70 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
          <span className="text-xs font-bold text-foreground">{items.length}</span>
          <span className="text-[10px] text-muted-foreground font-medium">items</span>
        </div>
      </div>

      <div className="relative w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-foreground">{cat.label}</h2>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {preview.length > 0 ? (
          <div className="flex items-center -space-x-2.5">
            {preview.map((item, i) => (
              <PreviewThumb key={item.id} item={item} style={{ zIndex: preview.length - i }} />
            ))}
            {items.length > 4 && (
              <div
                className="w-9 h-9 rounded-full border-[2.5px] border-background bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shadow-sm"
                style={{ zIndex: 0 }}
              >
                +{items.length - 4}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground font-medium leading-tight">{cat.emptyMsg}</p>
        )}
      </div>
    </motion.button>
  );
}

// Individual photo card in gallery
function GalleryCard({
  item,
  onClick,
  onDelete,
}: {
  item: ClosetItem;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { src } = useClosetImage(item.imageId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative aspect-square rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-card group cursor-pointer"
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
          <ImageIcon className="w-7 h-7 text-muted-foreground/40 mb-1" />
        </div>
      )}

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

      {/* Style dots */}
      <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
        {item.styles.slice(0, 2).map(s => (
          <span
            key={s}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-bold text-white"
          >
            {s.charAt(0)}
          </span>
        ))}
      </div>

      {/* Delete menu */}
      <div className="absolute top-1.5 right-1.5" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-6 h-6 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28 rounded-xl">
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="absolute bottom-2 left-2 right-2 text-white font-semibold text-xs leading-tight truncate drop-shadow pointer-events-none">
        {item.name}
      </p>
    </motion.div>
  );
}

// Per-category gallery view
function CategoryGallery({
  cat,
  items,
  onBack,
  onAdd,
  onEdit,
  onDelete,
}: {
  cat: (typeof CATEGORIES)[0];
  items: ClosetItem[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (item: ClosetItem) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = cat.icon;

  return (
    <motion.div
      key="gallery"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      className="absolute inset-0 bg-background overflow-y-auto pb-32"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/40 px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.iconColor} bg-card border border-border/50`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-display font-bold leading-none">{cat.fullLabel}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-foreground text-background rounded-full px-4 py-2 text-sm font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <div className="px-4 pt-5">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br ${cat.bg} border border-border/40`}>
              <Icon className={`w-10 h-10 ${cat.iconColor}`} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-bold text-foreground">No {cat.label.toLowerCase()} yet</p>
              <p className="text-sm text-muted-foreground">{cat.emptyMsg}</p>
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-foreground text-background rounded-2xl px-6 py-3 text-sm font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Add first item
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            <AnimatePresence>
              {items.map(item => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onClick={() => onEdit(item)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}
            </AnimatePresence>

            {/* Add tile */}
            <motion.button
              layout
              onClick={onAdd}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold">Add</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Closet() {
  const { settings, updateSettings } = useFitCheckSettings();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [initialCat, setInitialCat] = useState<Category>("tops");

  const handleSaveItem = (savedItem: ClosetItem) => {
    const currentCloset = { ...settings.closet };
    if (editingItem && editingItem.category !== savedItem.category) {
      currentCloset[editingItem.category] = currentCloset[editingItem.category].filter(i => i.id !== savedItem.id);
    }
    const catArray = currentCloset[savedItem.category];
    const existingIndex = catArray.findIndex(i => i.id === savedItem.id);
    if (existingIndex >= 0) {
      catArray[existingIndex] = savedItem;
    } else {
      catArray.push(savedItem);
    }
    updateSettings({ closet: currentCloset });
  };

  const handleDeleteItem = async (id: string, category: Category) => {
    const currentCloset = { ...settings.closet };
    const item = currentCloset[category].find(i => i.id === id);
    if (item?.imageId) {
      try { await deleteImage(item.imageId); } catch {}
    }
    currentCloset[category] = currentCloset[category].filter(i => i.id !== id);
    updateSettings({ closet: currentCloset });
  };

  const openAdd = (cat: Category) => {
    setEditingItem(null);
    setInitialCat(cat);
    setEditorOpen(true);
  };

  const openEdit = (item: ClosetItem) => {
    setEditingItem(item);
    setInitialCat(item.category);
    setEditorOpen(true);
  };

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Landing — always mounted so scroll position is preserved */}
      <motion.div
        className="p-5 space-y-6 pb-32"
        animate={{ opacity: activeCategory ? 0 : 1, pointerEvents: activeCategory ? "none" : "auto" }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center gap-4 mb-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
          <div>
            <h1 className="text-4xl font-display font-bold">My <span className="brand-gradient-text">Closet</span></h1>
            <p className="text-muted-foreground font-medium mt-1 text-sm">Tap a section to browse your pieces.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.id} className={i === CATEGORIES.length - 1 && CATEGORIES.length % 2 !== 0 ? "col-span-2" : ""}>
              <CategoryCard
                cat={cat}
                items={settings.closet[cat.id] ?? []}
                onClick={() => setActiveCategory(cat.id)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gallery overlay */}
      <AnimatePresence>
        {activeCategory && activeCat && (
          <CategoryGallery
            cat={activeCat}
            items={settings.closet[activeCategory]}
            onBack={() => setActiveCategory(null)}
            onAdd={() => openAdd(activeCategory)}
            onEdit={openEdit}
            onDelete={id => handleDeleteItem(id, activeCategory)}
          />
        )}
      </AnimatePresence>

      <ItemEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={editingItem}
        initialCategory={initialCat}
        currentStyle={settings.style}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
