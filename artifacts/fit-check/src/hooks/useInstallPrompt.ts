import { useState, useEffect } from "react";

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
}

export function useInstallPrompt() {
  const [promptAvailable, setPromptAvailable] = useState(
    !!(window as any).__installPromptEvent
  );
  const [installed, setInstalled] = useState(isInStandaloneMode());
  const ios = isIOS();

  useEffect(() => {
    const onReady = () => setPromptAvailable(true);
    window.addEventListener("installpromptready", onReady);

    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const prompt = (window as any).__installPromptEvent;
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      (window as any).__installPromptEvent = null;
      setPromptAvailable(false);
      setInstalled(true);
    }
    return outcome === "accepted";
  };

  const canInstall = !installed && (ios || promptAvailable);

  return { canInstall, installed, ios, promptAvailable, install };
}
