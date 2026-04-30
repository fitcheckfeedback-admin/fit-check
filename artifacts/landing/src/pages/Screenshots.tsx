const screens = [
  {
    id: 1,
    headline: "Know your fit before\nyou get dressed.",
    sub: "Live weather → perfect outfit, instantly",
    bg: "from-amber-400 to-orange-500",
    textColor: "text-white",
    ui: <HomeScreen />,
  },
  {
    id: 2,
    headline: "Plan your week.\nDress with confidence.",
    sub: "5-day forecast meets your wardrobe",
    bg: "from-sky-400 to-blue-600",
    textColor: "text-white",
    ui: <ForecastScreen />,
  },
  {
    id: 3,
    headline: "Your closet,\nmade smarter.",
    sub: "Upload your clothes. Wear them better.",
    bg: "from-violet-500 to-purple-700",
    textColor: "text-white",
    ui: <ClosetScreen />,
  },
  {
    id: 4,
    headline: "Dress your way,\nevery day.",
    sub: "Pick your vibe. Get outfits that match.",
    bg: "from-emerald-400 to-teal-600",
    textColor: "text-white",
    ui: <StyleScreen />,
  },
  {
    id: 5,
    headline: "Pack light.\nPlan right.",
    sub: "Trip planner builds your packing list",
    bg: "from-rose-400 to-pink-600",
    textColor: "text-white",
    ui: <TripScreen />,
  },
];

function PhoneFrame({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className={`relative w-[280px] h-[560px] rounded-[44px] bg-gradient-to-b ${bg} p-[3px] shadow-2xl`}>
      <div className="w-full h-full rounded-[42px] bg-zinc-950 overflow-hidden relative flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-950 rounded-b-2xl z-10" />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function HomeScreen() {
  return (
    <div className="h-full bg-zinc-50 flex flex-col pt-8">
      <div className="px-4 pt-2 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-zinc-400 font-medium">GOOD MORNING</p>
          <p className="text-xs font-bold text-zinc-800">Atlanta, GA</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">J</span>
        </div>
      </div>
      <div className="mx-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 mb-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[8px] text-amber-100 font-semibold uppercase tracking-wide">TODAY</p>
            <p className="text-2xl font-black text-white">72°F</p>
            <p className="text-[9px] text-amber-100">Feels like 70° · Sunny</p>
          </div>
          <span className="text-3xl">☀️</span>
        </div>
        <div className="mt-2 pt-2 border-t border-amber-300/40">
          <p className="text-[8px] text-amber-100 font-semibold mb-1">TODAY'S FIT ✨</p>
          <p className="text-sm font-bold text-white">The Weekend Look</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {["Linen Shirt", "Chinos", "Sneakers"].map(item => (
              <span key={item} className="text-[7px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-3 grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Morning", icon: "🌤", temp: "64°" },
          { label: "Noon", icon: "☀️", temp: "72°" },
          { label: "Evening", icon: "🌙", temp: "61°" },
        ].map(t => (
          <div key={t.label} className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-[7px] text-zinc-400 mb-0.5">{t.label}</p>
            <p className="text-sm">{t.icon}</p>
            <p className="text-[9px] font-bold text-zinc-800">{t.temp}</p>
          </div>
        ))}
      </div>
      <div className="mx-3 bg-white rounded-xl p-3 shadow-sm">
        <p className="text-[8px] font-semibold text-zinc-500 mb-2">OUTFIT DETAILS</p>
        {[
          { cat: "Top", item: "White Linen Shirt" },
          { cat: "Bottom", item: "Slim Chinos" },
          { cat: "Shoes", item: "Clean Sneakers" },
          { cat: "Extra", item: "Sunglasses" },
        ].map(r => (
          <div key={r.cat} className="flex justify-between py-1 border-b border-zinc-50 last:border-0">
            <span className="text-[7px] text-zinc-400">{r.cat}</span>
            <span className="text-[7px] font-medium text-zinc-700">{r.item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastScreen() {
  const days = [
    { day: "Today", icon: "☀️", hi: 72, lo: 61, bar: 0 },
    { day: "Thu", icon: "⛅", hi: 68, lo: 58, bar: 10 },
    { day: "Fri", icon: "🌧", hi: 63, lo: 55, bar: 80 },
    { day: "Sat", icon: "⛅", hi: 70, lo: 60, bar: 20 },
    { day: "Sun", icon: "☀️", hi: 75, lo: 63, bar: 0 },
  ];
  return (
    <div className="h-full bg-zinc-50 flex flex-col pt-8">
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs font-bold text-zinc-800">5-Day Forecast</p>
        <p className="text-[9px] text-zinc-400">Atlanta, GA</p>
      </div>
      <div className="mx-3 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-white">72°</p>
            <p className="text-[9px] text-sky-100">Partly Cloudy · Wind 8mph</p>
          </div>
          <span className="text-3xl">⛅</span>
        </div>
        <div className="mt-2 flex gap-2">
          {["💧 22%", "🌬 8mph", "💦 45%"].map(s => (
            <span key={s} className="text-[7px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>
      <div className="mx-3 bg-white rounded-xl shadow-sm overflow-hidden">
        {days.map((d, i) => (
          <div key={d.day} className={`flex items-center px-3 py-2 ${i < days.length - 1 ? "border-b border-zinc-50" : ""}`}>
            <span className="text-[8px] text-zinc-500 w-8">{d.day}</span>
            <span className="text-sm mx-2">{d.icon}</span>
            <div className="flex-1 mx-2">
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${d.bar}%`, minWidth: "4px" }} />
              </div>
            </div>
            <span className="text-[7px] text-zinc-400 w-5">{d.lo}°</span>
            <span className="text-[8px] font-bold text-zinc-800 w-5">{d.hi}°</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-2 bg-white rounded-xl p-3 shadow-sm">
        <p className="text-[8px] font-semibold text-zinc-500 mb-1.5">WHAT TO WEAR THIS WEEK</p>
        <p className="text-[9px] text-zinc-700">Grab a jacket for Friday's rain. Light layers through the weekend.</p>
      </div>
    </div>
  );
}

function ClosetScreen() {
  const items = [
    { name: "White Tee", cat: "Tops", color: "#f5f5f5" },
    { name: "Navy Hoodie", cat: "Tops", color: "#1e3a5f" },
    { name: "Slim Chinos", cat: "Bottoms", color: "#c4a882" },
    { name: "Black Joggers", cat: "Bottoms", color: "#222" },
    { name: "White AF1", cat: "Shoes", color: "#f0f0f0" },
    { name: "Rain Jacket", cat: "Outerwear", color: "#2563eb" },
  ];
  return (
    <div className="h-full bg-zinc-50 flex flex-col pt-8">
      <div className="px-4 pt-2 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-zinc-800">My Closet</p>
          <p className="text-[9px] text-zinc-400">6 items · 2 gaps found</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
          <span className="text-white text-[10px]">+</span>
        </div>
      </div>
      <div className="mx-3 flex gap-1.5 mb-2 overflow-x-hidden">
        {["All", "Tops", "Bottoms", "Shoes", "Outerwear"].map((cat, i) => (
          <span key={cat} className={`text-[7px] px-2 py-0.5 rounded-full whitespace-nowrap ${i === 0 ? "bg-violet-500 text-white" : "bg-white text-zinc-500 border border-zinc-200"}`}>{cat}</span>
        ))}
      </div>
      <div className="mx-3 grid grid-cols-3 gap-1.5 mb-2">
        {items.map(item => (
          <div key={item.name} className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="h-14 flex items-center justify-center" style={{ backgroundColor: item.color + "22" }}>
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: item.color }} />
            </div>
            <div className="p-1">
              <p className="text-[6px] font-semibold text-zinc-700 truncate">{item.name}</p>
              <p className="text-[5px] text-zinc-400">{item.cat}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mx-3 bg-violet-50 border border-violet-200 rounded-xl p-2.5">
        <p className="text-[7px] font-semibold text-violet-700 mb-1">⚠️ WARDROBE GAPS</p>
        <p className="text-[7px] text-violet-600">No outerwear for cold days below 40°. Consider adding a puffer coat.</p>
      </div>
    </div>
  );
}

function StyleScreen() {
  const vibes = [
    { name: "Casual", icon: "👕", desc: "Everyday basics", active: false },
    { name: "Streetwear", icon: "🧢", desc: "Trendy & relaxed", active: true },
    { name: "Athletic", icon: "⚡", desc: "Performance gear", active: false },
    { name: "Workwear", icon: "🔧", desc: "Built to last", active: false },
    { name: "Minimal", icon: "⬜", desc: "Clean & neutral", active: false },
  ];
  return (
    <div className="h-full bg-zinc-50 flex flex-col pt-8">
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs font-bold text-zinc-800">Your Style Vibe</p>
        <p className="text-[9px] text-zinc-400">Choose how you like to dress</p>
      </div>
      <div className="mx-3 space-y-1.5">
        {vibes.map(v => (
          <div key={v.name} className={`flex items-center gap-3 p-3 rounded-xl border ${v.active ? "bg-emerald-500 border-emerald-500" : "bg-white border-zinc-100"} shadow-sm`}>
            <span className="text-lg">{v.icon}</span>
            <div className="flex-1">
              <p className={`text-[9px] font-bold ${v.active ? "text-white" : "text-zinc-800"}`}>{v.name}</p>
              <p className={`text-[7px] ${v.active ? "text-emerald-100" : "text-zinc-400"}`}>{v.desc}</p>
            </div>
            {v.active && <span className="text-white text-[10px]">✓</span>}
          </div>
        ))}
      </div>
      <div className="mx-3 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
        <p className="text-[7px] font-semibold text-emerald-700 mb-0.5">STREETWEAR ACTIVE</p>
        <p className="text-[7px] text-emerald-600">Your fits will lean toward hoodies, baggy cargos, and clean kicks.</p>
      </div>
    </div>
  );
}

function TripScreen() {
  return (
    <div className="h-full bg-zinc-50 flex flex-col pt-8">
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs font-bold text-zinc-800">Trip Planner</p>
        <p className="text-[9px] text-zinc-400">Miami · May 10–14 · 5 days</p>
      </div>
      <div className="mx-3 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl p-3 mb-3">
        <p className="text-[8px] text-rose-100 font-semibold mb-1">TRIP FORECAST</p>
        <div className="flex justify-between">
          {["Sat", "Sun", "Mon", "Tue", "Wed"].map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-0.5">
              <span className="text-[6px] text-rose-200">{d}</span>
              <span className="text-sm">{["☀️","☀️","⛅","🌧","☀️"][i]}</span>
              <span className="text-[8px] font-bold text-white">{[84,87,82,76,89][i]}°</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-3 space-y-1.5">
        <p className="text-[8px] font-semibold text-zinc-500 px-0.5">PACKING LIST</p>
        {[
          { item: "Light T-Shirts ×3", packed: true },
          { item: "Swim Shorts", packed: true },
          { item: "Linen Pants", packed: true },
          { item: "Sunglasses", packed: false },
          { item: "Rain Jacket (Mon)", packed: false },
          { item: "Sandals", packed: false },
        ].map(p => (
          <div key={p.item} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${p.packed ? "bg-rose-500 border-rose-500" : "border-zinc-200"}`}>
              {p.packed && <span className="text-white text-[6px]">✓</span>}
            </div>
            <span className={`text-[8px] ${p.packed ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{p.item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Screenshots() {
  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white mb-2">FIT✔️ App Store Screenshots</h1>
          <p className="text-zinc-400 text-sm">Right-click each screenshot to save · Use at 390×844 or scale up to App Store sizes</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {screens.map((screen) => (
            <div key={screen.id} className="flex flex-col items-center gap-4">
              <div className={`w-[280px] h-[607px] rounded-[36px] bg-gradient-to-b ${screen.bg} p-5 flex flex-col items-center shadow-2xl`}>
                <p className={`text-center text-lg font-black leading-tight mb-1 ${screen.textColor} whitespace-pre-line`}>
                  {screen.headline}
                </p>
                <p className={`text-center text-[11px] mb-4 opacity-80 ${screen.textColor}`}>{screen.sub}</p>
                <PhoneFrame bg={screen.bg}>
                  {screen.ui}
                </PhoneFrame>
              </div>
              <p className="text-zinc-500 text-xs">Screenshot {screen.id} of 5</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm mb-2">Need larger sizes for App Store Connect?</p>
          <p className="text-zinc-600 text-xs">Take these to any screenshot resizer (eg. appscreenshot.com) and scale to 1290×2796 (iPhone 6.9") and 1242×2688 (iPhone 6.5")</p>
        </div>
      </div>
    </div>
  );
}
