import { useState, useEffect } from "react";
import { FitCheckSettings, getSettings, saveSettings } from "../lib/storage";

export function useFitCheckSettings() {
  const [settings, setSettings] = useState<FitCheckSettings>(getSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getSettings());
    };

    window.addEventListener("fitcheck.settings.updated", handleUpdate);
    return () => window.removeEventListener("fitcheck.settings.updated", handleUpdate);
  }, []);

  const updateSettings = (newSettings: Partial<FitCheckSettings>) => {
    saveSettings(newSettings);
  };

  return { settings, updateSettings };
}
