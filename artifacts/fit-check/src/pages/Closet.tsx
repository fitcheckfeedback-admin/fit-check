import { useState } from "react";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { ClosetData } from "@/lib/storage";

type Category = keyof ClosetData;

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tops", label: "Tops & Shirts" },
  { id: "bottoms", label: "Bottoms & Pants" },
  { id: "outerwear", label: "Outerwear" },
  { id: "shoes", label: "Shoes" }
];

export default function Closet() {
  const { settings, updateSettings } = useFitCheckSettings();
  const [newItems, setNewItems] = useState<Record<Category, string>>({
    tops: "", bottoms: "", outerwear: "", shoes: ""
  });

  const handleAdd = (category: Category, e: React.FormEvent) => {
    e.preventDefault();
    const val = newItems[category].trim();
    if (!val) return;

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
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Closet</h1>
        <p className="text-muted-foreground">Add items to see them suggested in your daily recommendations.</p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(({ id, label }) => (
          <section key={id} className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">{label}</h2>
            
            <ul className="space-y-2">
              {settings.closet[id].map((item, i) => (
                <li key={i} className="flex items-center justify-between bg-card px-4 py-3 rounded-xl border shadow-sm">
                  <span className="font-medium">{item}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(id, i)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <form onSubmit={(e) => handleAdd(id, e)} className="flex gap-2">
              <Input 
                value={newItems[id]}
                onChange={(e) => setNewItems(prev => ({ ...prev, [id]: e.target.value }))}
                placeholder={`Add ${label.toLowerCase()}...`}
                className="bg-card rounded-xl"
              />
              <Button type="submit" size="icon" className="rounded-xl shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}
