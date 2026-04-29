import { useState, useEffect, useCallback } from "react";

const CACHE_KEY = "fitcheck.premiumStatus";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PremiumStatus {
  isPro: boolean;
  loading: boolean;
  refetch: () => void;
}

async function checkPremium(deviceId: string): Promise<boolean> {
  // Clear cache to get fresh status
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}

  const res = await fetch(`/api/premium/status?deviceId=${encodeURIComponent(deviceId)}`);
  if (!res.ok) return false;
  const { isPro } = await res.json();

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ isPro, ts: Date.now() }));
  } catch {}

  return Boolean(isPro);
}

export function usePremium(): PremiumStatus {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async (forceRefresh = false) => {
    const deviceId = localStorage.getItem("fitcheck.deviceId");
    if (!deviceId) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    // Try cache first (unless forced refresh)
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { isPro: cachedPro, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL_MS) {
            setIsPro(cachedPro);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    try {
      const pro = await checkPremium(deviceId);
      setIsPro(pro);
    } catch {
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStatus(true);
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  return { isPro, loading, refetch };
}
