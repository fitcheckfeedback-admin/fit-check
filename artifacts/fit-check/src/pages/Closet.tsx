import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Shirt, Footprints, Layers, Scissors } from "lucide-react";
import { ClosetData } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

type Category = keyof ClosetData;

const CATEGORIES: { id: Category; label: string; icon: any; suggestions: string[]; emptyMsg: string }[] = [
  { 
    id: "tops", 
    label: "Tops & Shirts", 
    icon: Shirt,
    suggestions: ["White tee", "Black hoodie", "Grey sweater", "Flannel shirt"],
    emptyMsg: "Add your favorite shirts and hoodies."
  },
  { 
    id: "bottoms", 
    label: "Bottoms & Pants", 
    icon: Scissors,
    suggestions: ["Blue jeans", "Black joggers", "Khaki chinos", "Athletic shorts"],
    emptyMsg: "Add your go-to jeans, pants, and shorts."
  },
  { 
    id: "outerwear", 
    label: "Outerwear", 
    icon: Layers,
    suggestions: ["Denim jacket", "Winter parka", "Light windbreaker", "Leather jacket"],
    emptyMsg: "Add your jackets, coats, and outer layers."
  },
  { 
    id: "shoes", 
    label: "Shoes", 
    icon: Footprints,
    suggestions: ["White sneakers", "Running shoes", "Winter boots", "Sandals"],
    emptyMsg: "Add your everyday kicks and weather-specific shoes."
  }
];

export default function Closet() {
  const { settings, updateSettings } = useFitCheckSettings();
  const [newItems, setNewItems] = useState<Record<Category, string>>({
    tops: "", bottoms: "", outerwear: "", shoes: ""
  });
  const [focusedCat, setFocusedCat] = useState<Category | null>(null);

  const handleAdd = (category: Category, itemVal?: string) => {
    const val = (itemVal || newItems[category]).trim();
    if (!val) return;

    // Prevent duplicates
    if (settings.closet[category].map(i => i.toLowerCase()).includes(val.toLowerCase())) {
      setNewItems(prev => ({ ...prev, [category]: "" }));
      return;
    }

    const currentCloset = settings.closet;
    updateSettings({
      closet: {
        ...currentCloset,
        [category]: [...currentCloset[category], val]
      }
    });

    setNewItems(prev => ({ ...prev, [category]: "" }));
  };

  const handleRemove = (category: Category, index: number) => {
    const currentCloset = settings.closet;
    const newArr = [...currentCloset[category]];
    newArr.splice(index, 1);
    
    updateSettings({
      closet: {
        ...currentCloset,
        [category]: newArr
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 pb-12"
    >
      <div className="flex items-center gap-3 mb-2">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm hidden" />
        <div>
          <h1 className="text-4xl font-display font-bold">My Closet</h1>
          <p className="text-muted-foreground font-medium">Add items to see them matched in your daily recommendations.</p>
        </div>
      </div>

      <div className="space-y-10">
        {CATEGORIES.map(({ id, label, icon: Icon, suggestions, emptyMsg }) => {
          const items = settings.closet[id];
          const isFocused = focusedCat === id;

          return (
            <section key={id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-display font-bold">{label}</h2>
                <span className="ml-auto bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              
              <div className="space-y-3">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleAdd(id); }} 
                  className="relative flex gap-2"
                >
                  <Input 
                    value={newItems[id]}
                    onChange={(e) => setNewItems(prev => ({ ...prev, [id]: e.target.value }))}
                    onFocus={() => setFocusedCat(id)}
                    onBlur={() => setTimeout(() => setFocusedCat(null), 200)}
                    placeholder={`Add new ${label.toLowerCase()}...`}
                    className="bg-card rounded-2xl h-14 text-base border-2 shadow-sm focus-visible:ring-primary"
                  />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shrink-0 shadow-sm">
                    <Plus className="w-6 h-6" />
                  </Button>
                </form>

                {/* Suggestions dropdown-ish below input */}
                <AnimatePresence>
                  {isFocused && !newItems[id] && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {suggestions.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAdd(id, sug)}
                          className="px-3 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          + {sug}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="min-h-[60px]">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                      <p className="text-sm font-medium text-muted-foreground">{emptyMsg}</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <AnimatePresence>
                        {items.map((item, i) => (
                          <motion.div 
                            key={`${item}-${i}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            layout
                            className="flex items-center gap-2 bg-card border px-4 py-2 rounded-2xl shadow-sm group"
                          >
                            <span className="font-medium text-sm">{item}</span>
                            <button 
                              onClick={() => handleRemove(id, i)}
                              className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </motion.div>
  );
}
