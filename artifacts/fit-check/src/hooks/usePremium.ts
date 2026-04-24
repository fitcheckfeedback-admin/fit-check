import { useState, useEffect } from "react";

const CACHE_KEY = "fitcheck.premiumStatus";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PremiumStatus {
  isPro: boolean;
  loading: boolean;
}

export function usePremium(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({ isPro: false, loading: true });

  useEffect(() => {
    const deviceId = localStorage.getItem("fitcheck.deviceId");
    if (!deviceId) {
      setStatus({ isPro: false, loading: false });
      return;
    }

    // Check cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { isPro, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL_MS) {
          setStatus({ isPro, loading: false });
          return;
        }
      }
    } catch {}

    fetch(`/api/premium/status?deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.json())
      .then(({ isPro }) => {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ isPro, ts: Date.now() }));
        setStatus({ isPro, loading: false });
      })
      .catch(() => {
        setStatus({ isPro: false, loading: false });
      });
  }, []);

  return status;
}
