import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocation } from "wouter";

export default function Settings() {
  const { settings, updateSettings } = useFitCheckSettings();
  const { getCurrentPosition, loading } = useGeolocation();
  const [, setLocation] = useLocation();

  const handleUpdateLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      updateSettings({
        location: {
          lat: pos.lat,
          lon: pos.lon,
          name: "Current Location"
        }
      });
    } catch (e) {
      console.error(e);
      setLocation("/onboarding"); // fallback to search
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Location</h2>
        <div className="p-4 bg-card rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <MapPin className="w-5 h-5 text-primary" />
            {settings.location?.name || "Not set"}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="w-full" onClick={handleUpdateLocation} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Re-detect
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/onboarding")}>
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Temperature Units</h2>
        <RadioGroup 
          value={settings.units} 
          onValueChange={(val) => updateSettings({ units: val as "f" | "c" })}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="f" id="f" className="peer sr-only" />
            <Label
              htmlFor="f"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
            >
              Fahrenheit (°F)
            </Label>
          </div>
          <div>
            <RadioGroupItem value="c" id="c" className="peer sr-only" />
            <Label
              htmlFor="c"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
            >
              Celsius (°C)
            </Label>
          </div>
        </RadioGroup>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Theme</h2>
        <RadioGroup 
          value={settings.theme} 
          onValueChange={(val) => updateSettings({ theme: val as any })}
          className="grid grid-cols-3 gap-2"
        >
          {["light", "dark", "system"].map(t => (
            <div key={t}>
              <RadioGroupItem value={t} id={t} className="peer sr-only" />
              <Label
                htmlFor={t}
                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer capitalize"
              >
                {t}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <section className="pt-8">
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={() => {
            updateSettings({ onboarded: false });
            setLocation("/onboarding");
          }}
        >
          Reset App
        </Button>
      </section>
    </div>
  );
}
