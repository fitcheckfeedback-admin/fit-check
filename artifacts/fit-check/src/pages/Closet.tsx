import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Plus, Shirt, Footprints, Layers, Scissors, Image as ImageIcon, MoreVertical, Trash2 } from "lucide-react";
import { ClosetItem, Category } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { useClosetImage } from "@/hooks/useClosetImage";
import { ItemEditor } from "@/components/ItemEditor";
import { deleteImage } from "@/lib/imageStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CATEGORIES: { id: Category; label: string; icon: any; emptyMsg: string }[] = [
  { 
    id: "tops", 
    label: "Tops & Shirts", 
    icon: Shirt,
    emptyMsg: "Add your favorite shirts and hoodies."
  },
  { 
    id: "bottoms", 
    label: "Bottoms & Pants", 
    icon: Scissors,
    emptyMsg: "Add your go-to jeans, pants, and shorts."
  },
  { 
    id: "outerwear", 
    label: "Outerwear", 
    icon: Layers,
    emptyMsg: "Add your jackets, coats, and outer layers."
  },
  { 
    id: "shoes", 
    label: "Shoes", 
    icon: Footprints,
    emptyMsg: "Add your everyday kicks and weather-specific shoes."
  }
];

function ItemCard({ item, onClick, onDelete }: { item: ClosetItem; onClick: () => void; onDelete: () => void }) {
  const { src } = useClosetImage(item.imageId);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.97 }}
      className="relative aspect-square bg-card rounded-2xl border-2 border-border/50 shadow-sm overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
        </div>
      )}
      
      {/* Gradient Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 pointer-events-none" />

      {/* Style Chips */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%] pointer-events-none">
        {item.styles.slice(0, 3).map(style => (
          <span key={style} className="w-5 h-5 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-full text-[10px] font-bold text-foreground shadow-sm">
            {style.charAt(0)}
          </span>
        ))}
      </div>

      {/* Delete Menu */}
      <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-md text-foreground hover:bg-background/90 transition-colors shadow-sm">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-xl">
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium cursor-pointer">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
        <p className="text-white font-semibold text-sm leading-tight truncate drop-shadow-sm">{item.name}</p>
      </div>
    </motion.div>
  );
}

export default function Closet() {
  const { settings, updateSettings } = useFitCheckSettings();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClosetItem | null>(null);
  const [initialCat, setInitialCat] = useState<Category>("tops");

  const handleSaveItem = (savedItem: ClosetItem) => {
    const currentCloset = { ...settings.closet };
    
    // If editing and category changed, remove from old category
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
      try {
        await deleteImage(item.imageId);
      } catch (e) {
        console.error("Failed to delete image", e);
      }
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-32"
    >
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h1 className="text-4xl font-display font-bold">My Closet</h1>
          <p className="text-muted-foreground font-medium mt-1">Snap photos of your pieces to see them in your daily fits.</p>
        </div>
      </div>

      <div className="space-y-10">
        {CATEGORIES.map(({ id, label, icon: Icon, emptyMsg }) => {
          const items = settings.closet[id];

          return (
            <section key={id} className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-bold">{label}</h2>
                <span className="ml-auto bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {items.map((item) => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => openEdit(item)}
                      onDelete={() => handleDeleteItem(item.id, id)}
                    />
                  ))}
                </AnimatePresence>

                <motion.button
                  layout
                  onClick={() => openAdd(id)}
                  whileTap={{ scale: 0.97 }}
                  className={`aspect-square rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors ${items.length === 0 ? 'col-span-2 aspect-auto py-10' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm">{items.length === 0 ? emptyMsg : "Add item"}</span>
                  {items.length === 0 && (
                    <span className="text-xs text-primary font-bold mt-1">Tap to add</span>
                  )}
                </motion.button>
              </div>
            </section>
          );
        })}
      </div>

      <ItemEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={editingItem}
        initialCategory={initialCat}
        currentStyle={settings.style}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />
    </motion.div>
  );
}
