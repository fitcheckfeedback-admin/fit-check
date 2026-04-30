import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { motion } from "framer-motion";
import { ShoppingBag, Crown, Sparkles, ExternalLink, ChevronLeft, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { ProGate } from "@/components/ProGate";
import { isNative } from "@/lib/platform";
import { Browser } from "@capacitor/browser";

interface ProductCard {
  id: string;
  brand: string;
  name: string;
  price: string;
  category: string;
  closetKey: string;
  why: string;
  gradient: string;
  emoji: string;
  affiliateLink: string;
}

const ALL_PRODUCTS: ProductCard[] = [
  {
    id: "1",
    brand: "Banana Republic",
    name: "Classic Trench Coat",
    price: "$198",
    category: "Outerwear",
    closetKey: "outerwear",
    why: "You're missing a mid-season layer — covers rain and cool temps",
    gradient: "from-stone-300 to-stone-400",
    emoji: "🧥",
    affiliateLink: "https://bananarepublic.gap.com/browse/category.do?cid=1001921",
  },
  {
    id: "2",
    brand: "Allbirds",
    name: "Tree Runners",
    price: "$110",
    category: "Shoes",
    closetKey: "shoes",
    why: "A versatile sneaker that pairs with 80% of your existing wardrobe",
    gradient: "from-zinc-300 to-zinc-400",
    emoji: "👟",
    affiliateLink: "https://www.allbirds.com/collections/mens-runners",
  },
  {
    id: "3",
    brand: "Uniqlo",
    name: "Merino Crew Neck",
    price: "$49",
    category: "Tops",
    closetKey: "tops",
    why: "A merino base layer works with every bottom you own and handles cold snaps",
    gradient: "from-blue-200 to-indigo-300",
    emoji: "🔵",
    affiliateLink: "https://www.uniqlo.com/us/en/search?q=merino+crew+neck",
  },
  {
    id: "4",
    brand: "Levi's",
    name: "511 Slim Fit Jeans",
    price: "$79",
    category: "Bottoms",
    closetKey: "bottoms",
    why: "A second pair of slim jeans gives your outfits more variety",
    gradient: "from-blue-400 to-blue-600",
    emoji: "👖",
    affiliateLink: "https://www.levi.com/US/en_US/clothing/men/jeans/511-slim-fit-mens-jeans/p/045110093",
  },
  {
    id: "5",
    brand: "Frank And Oak",
    name: "Essential Oxford Shirt",
    price: "$75",
    category: "Tops",
    closetKey: "tops",
    why: "A sharp casual shirt that bridges smart and relaxed looks",
    gradient: "from-sky-200 to-blue-300",
    emoji: "👔",
    affiliateLink: "https://www.frankandoak.com/collections/mens-shirts",
  },
  {
    id: "6",
    brand: "Nike",
    name: "Air Force 1 '07",
    price: "$115",
    category: "Shoes",
    closetKey: "shoes",
    why: "An iconic clean white sneaker that works with almost everything",
    gradient: "from-gray-100 to-gray-200",
    emoji: "⬜",
    affiliateLink: "https://www.nike.com/t/air-force-1-07-mens-shoes",
  },
];

const ALL_ACCESSORIES: ProductCard[] = [
  {
    id: "a1",
    brand: "Madewell",
    name: "Canvas Tote Bag",
    price: "$38",
    category: "Accessories",
    closetKey: "accessories",
    why: "Casual and functional — works on warm days and pulls any outfit together",
    gradient: "from-amber-200 to-yellow-300",
    emoji: "👜",
    affiliateLink: "https://www.madewell.com/the-transport-tote-NF654.html",
  },
  {
    id: "a2",
    brand: "Quay",
    name: "High Key Sunglasses",
    price: "$65",
    category: "Accessories",
    closetKey: "accessories",
    why: "Classic frame style that complements casual looks and adds polish",
    gradient: "from-rose-300 to-pink-400",
    emoji: "🕶️",
    affiliateLink: "https://www.quayaustralia.com/collections/sunglasses",
  },
  {
    id: "a3",
    brand: "Everlane",
    name: "ReNew Fleece",
    price: "$68",
    category: "Outerwear",
    closetKey: "outerwear",
    why: "For mild evenings — lighter than a coat, smarter than a hoodie",
    gradient: "from-teal-300 to-emerald-400",
    emoji: "🟢",
    affiliateLink: "https://www.everlane.com/collections/womens-fleece",
  },
  {
    id: "a4",
    brand: "Fossil",
    name: "Minimalist Watch",
    price: "$95",
    category: "Accessories",
    closetKey: "accessories",
    why: "A clean watch instantly elevates even basic outfits",
    gradient: "from-amber-100 to-stone-300",
    emoji: "⌚",
    affiliateLink: "https://www.fossil.com/en-us/watches/",
  },
];

async function openLink(url: string) {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function getClosetCounts(closet: Record<string, string[] | undefined>) {
  return {
    outerwear: (closet.outerwear ?? []).length,
    shoes: (closet.shoes ?? []).length,
    tops: (closet.tops ?? []).length,
    bottoms: (closet.bottoms ?? []).length,
    accessories: (closet.accessories ?? []).length,
  };
}

function WardrobeGaps({ counts }: { counts: ReturnType<typeof getClosetCounts> }) {
  const gaps: { label: string; desc: string; icon: string }[] = [];

  if (counts.outerwear === 0)
    gaps.push({ label: "No outerwear", desc: "You have nothing to layer over your tops for cooler days", icon: "🧥" });
  if (counts.shoes < 2)
    gaps.push({ label: "Limited footwear", desc: "More than one pair of shoes opens up a lot of outfit options", icon: "👟" });
  if (counts.accessories === 0)
    gaps.push({ label: "No accessories", desc: "A bag or sunglasses can transform a basic look instantly", icon: "👜" });
  if (counts.tops < 3)
    gaps.push({ label: "Few tops", desc: "More variety in tops = more unique outfits from the same bottoms", icon: "👕" });

  if (gaps.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-black">Wardrobe Gaps Detected</h2>
      </div>
      {gaps.map(g => (
        <div key={g.label} className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
          <span className="text-xl shrink-0">{g.icon}</span>
          <div>
            <p className="text-sm font-bold">{g.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function prioritiseProducts(products: ProductCard[], counts: ReturnType<typeof getClosetCounts>): ProductCard[] {
  const gapKeys = new Set<string>();
  if (counts.outerwear === 0) gapKeys.add("outerwear");
  if (counts.shoes < 2) gapKeys.add("shoes");
  if (counts.tops < 3) gapKeys.add("tops");
  if (counts.bottoms < 2) gapKeys.add("bottoms");
  if (counts.accessories === 0) gapKeys.add("accessories");

  const priority = products.filter(p => gapKeys.has(p.closetKey));
  const rest = products.filter(p => !gapKeys.has(p.closetKey));
  return [...priority, ...rest].slice(0, 4);
}

function prioritiseAccessories(accessories: ProductCard[], counts: ReturnType<typeof getClosetCounts>): ProductCard[] {
  const gapKeys = new Set<string>();
  if (counts.accessories === 0) gapKeys.add("accessories");
  if (counts.outerwear === 0) gapKeys.add("outerwear");

  const priority = accessories.filter(p => gapKeys.has(p.closetKey));
  const rest = accessories.filter(p => !gapKeys.has(p.closetKey));
  return [...priority, ...rest].slice(0, 3);
}

function DiscoverContent() {
  const [, nav] = useLocation();
  const { settings } = useFitCheckSettings();
  const counts = getClosetCounts(settings.closet as Record<string, string[] | undefined>);
  const products = prioritiseProducts(ALL_PRODUCTS, counts);
  const accessories = prioritiseAccessories(ALL_ACCESSORIES, counts);

  return (
    <div className="flex-1 flex flex-col pb-6">
      <div className="relative px-5 pt-14 pb-6 overflow-hidden rounded-b-[2.5rem]"
        style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #2d1247 40%, #1a0a2e 100%)" }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <button onClick={() => nav("/")} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight leading-none text-white">Discover</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-full border border-amber-400/30">PRO</span>
            </div>
            <p className="text-xs text-white/50 font-medium mt-0.5">Shop the gap · Accessorize · Upgrade your look</p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-600">
            <Crown className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="relative z-10 bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-white/70 leading-relaxed">
            <span className="text-white font-bold">Matched to your wardrobe gaps</span> — products are ranked by what you're actually missing.
          </p>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">

        <p className="text-[10px] text-muted-foreground/60 text-center">
          FIT✔️ earns a small commission on purchases at no extra cost to you.
        </p>

        <WardrobeGaps counts={counts} />

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-black">Shop the Gap</h2>
            </div>
            <span className="text-xs text-muted-foreground">Ranked by your gaps</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => openLink(p.affiliateLink)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-2xl overflow-hidden text-left active:scale-95 transition-transform w-full"
              >
                <div className={`h-36 bg-gradient-to-br ${p.gradient} flex items-center justify-center relative`}>
                  <span className="text-5xl">{p.emoji}</span>
                  <div className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-black/30 text-white px-2 py-0.5 rounded-full">
                    {p.category}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">{p.brand}</p>
                  <p className="text-sm font-black leading-tight mb-1">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{p.why}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-foreground">{p.price}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                      Shop <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-black">Accessorize &amp; Elevate</h2>
          </div>

          <div className="space-y-3">
            {accessories.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => openLink(p.affiliateLink)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl active:scale-[0.99] transition-transform w-full text-left"
              >
                <div className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-2xl`}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">{p.brand}</p>
                  <p className="text-sm font-black">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed truncate">{p.why}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black text-base">{p.price}</p>
                  <div className="flex items-center gap-0.5 text-[10px] font-bold text-primary justify-end mt-0.5">
                    View <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 border border-border/50 rounded-2xl p-5 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-amber-500 mx-auto" />
          <p className="text-sm font-bold">More on the way</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Soon, FIT✔️ will pull live products matched to your exact style, size preferences, and price range — all personalised to your closet.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function Discover() {
  return (
    <ProGate
      feature="Shop the Gap"
      description="Unlock AI-curated product picks matched to your wardrobe gaps, style, and today's weather."
    >
      <DiscoverContent />
    </ProGate>
  );
}
