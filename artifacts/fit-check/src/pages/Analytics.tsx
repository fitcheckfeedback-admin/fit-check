import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, TrendingUp, Calendar, Clock, MapPin, Zap, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOKEN_KEY = "fitcheck.analyticsToken";

interface Summary {
  allTime:            { totalEvents: number; uniqueDevices: number };
  today:              { totalEvents: number; uniqueDevices: number };
  last7Days:          { totalEvents: number; uniqueDevices: number };
  last30Days:         { totalEvents: number; uniqueDevices: number };
  perDay:             { date: string; events: number; uniqueDevices: number }[];
  perHour:            { hour: number; events: number }[];
  featurePopularity:  { feature: string; count: number; pct: number }[];
  featurePopularity7d:{ feature: string; count: number }[];
  locationDistribution: { city: string; uniqueDevices: number; opens: number }[];
  recent: { id: string; deviceId: string; eventType: string; metadata: Record<string, unknown> | null; createdAt: string }[];
}

const FEATURE_LABELS: Record<string, string> = {
  app_open:        "App Open",
  page_view:       "Page View",
  outfit_generated:"Outfit Generated",
  fit_card_opened: "Fit Card Opened",
  fit_card_shared: "Fit Card Shared",
  fit_card_saved:  "Fit Card Saved",
  fit_saved:       "Fit Saved",
  fit_unsaved:     "Fit Unsaved",
  wardrobe_item_added: "Wardrobe Item Added",
  reminder_created:"Reminder Created",
  forecast_viewed: "Forecast Viewed",
  voice_used:      "Voice Used",
  location_set:    "Location Set",
  style_changed:   "Style Changed",
  settings_opened: "Settings Opened",
};

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setError("Incorrect password."); return; }
      const { token } = await res.json();
      sessionStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Fit Check usage dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your dashboard password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-12 rounded-xl text-base"
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive font-medium text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
            disabled={loading || !password}
          >
            {loading ? "Checking..." : "Enter Dashboard"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-destructive">{error || "No data"}</p>
      </div>
    );
  }

  // Fill missing hours with 0
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const found = data.perHour.find(r => Number(r.hour) === h);
    return { hour: `${h}:00`, events: found ? Number(found.events) : 0 };
  });

  const dailyData = data.perDay.map(r => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    opens: Number(r.uniqueDevices),
    events: Number(r.events),
  }));

  const featureData = data.featurePopularity.slice(0, 10).map(r => ({
    name: FEATURE_LABELS[r.feature] ?? r.feature,
    count: Number(r.count),
    pct: r.pct,
  }));

  const topCities = data.locationDistribution;
  const maxCityUsers = topCities[0] ? Number(topCities[0].uniqueDevices) : 1;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl" />
          <div>
            <h1 className="text-lg font-bold leading-none">Analytics</h1>
            <p className="text-xs text-muted-foreground">Fit Check Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-4xl mx-auto pb-16">

        {/* Lifetime unique user counter — prominent live display */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 rounded-3xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live · All-time unique users</span>
              </div>
              <motion.div
                key={data.allTime.uniqueDevices}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-6xl font-black tracking-tighter text-foreground"
              >
                {Number(data.allTime.uniqueDevices).toLocaleString()}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-2">
                {Number(data.allTime.totalEvents).toLocaleString()} lifetime events · refreshes every 30s
              </p>
            </div>
            <div className="p-3 bg-amber-500/15 rounded-2xl">
              <Users className="w-7 h-7 text-amber-500" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="All-time users"
            value={data.allTime.uniqueDevices}
            sub={`${data.allTime.totalEvents.toLocaleString()} total events`}
            icon={Users}
            accent="bg-amber-500"
          />
          <StatCard
            label="Today"
            value={data.today.uniqueDevices}
            sub={`${data.today.totalEvents} events today`}
            icon={Zap}
            accent="bg-green-500"
          />
          <StatCard
            label="Last 7 days"
            value={data.last7Days.uniqueDevices}
            sub={`${data.last7Days.totalEvents.toLocaleString()} events`}
            icon={TrendingUp}
            accent="bg-blue-500"
          />
          <StatCard
            label="Last 30 days"
            value={data.last30Days.uniqueDevices}
            sub={`${data.last30Days.totalEvents.toLocaleString()} events`}
            icon={Calendar}
            accent="bg-purple-500"
          />
        </div>

        {/* Daily opens — line chart */}
        {dailyData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-4">Daily Users — Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number, name: string) => [v, name === "opens" ? "Unique users" : "Events"]}
                />
                <Line type="monotone" dataKey="opens" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="opens" />
                <Line type="monotone" dataKey="events" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="events" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500 rounded" /><span className="text-xs text-muted-foreground">Unique users</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-slate-400 rounded" /><span className="text-xs text-muted-foreground">Total events</span></div>
            </div>
          </motion.div>
        )}

        {/* Hourly — bar chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-1">Activity by Hour — Last 24h</h2>
          <p className="text-xs text-muted-foreground mb-4">When users are most active</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [v, "Events"]}
              />
              <Bar dataKey="events" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feature popularity */}
        {featureData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-1">Most Used Features</h2>
            <p className="text-xs text-muted-foreground mb-4">All time</p>
            <div className="space-y-3">
              {featureData.map((f, i) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.count.toLocaleString()} <span className="text-amber-500 font-bold">{f.pct}%</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.pct}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Location distribution — always visible */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold">Cities</h2>
            </div>
            {topCities.length > 0 && (
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {topCities.length} {topCities.length === 1 ? "city" : "cities"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-4">All cities where the app is in use, ranked by unique users</p>

          {topCities.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">No city data yet</p>
              <p className="text-xs text-muted-foreground/70">Cities appear here once users open the app with a named location set.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {topCities.map((loc, i) => {
                const pct = Math.round((Number(loc.uniqueDevices) / maxCityUsers) * 100);
                return (
                  <div key={loc.city}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                        <span className="text-xs font-semibold text-foreground">{loc.city}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-foreground">{Number(loc.uniqueDevices).toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">users</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-7">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent events feed */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {data.recent.map(evt => (
              <div key={evt.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {FEATURE_LABELS[evt.eventType] ?? evt.eventType}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(evt.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {evt.deviceId.slice(0, 8)}…
                    </span>
                    {evt.metadata && (evt.metadata as Record<string, unknown>).city ? (
                      <span className="text-[10px] font-semibold text-blue-500">
                        {String((evt.metadata as Record<string, unknown>).city)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 italic">no location</span>
                    )}
                    {evt.metadata && (evt.metadata as Record<string, unknown>).page && (
                      <span className="text-[10px] text-purple-500">
                        {String((evt.metadata as Record<string, unknown>).page)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function Analytics() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));

  const handleLogin = (t: string) => setToken(t);
  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AnimatePresence mode="wait">
      {token ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard token={token} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginForm onLogin={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
