import { useState } from "react";

interface GeoLocationState {
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({ loading: false, error: null });

  const getCurrentPosition = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setState({ loading: false, error: "Geolocation not supported" });
        reject(new Error("Geolocation not supported"));
        return;
      }

      setState({ loading: true, error: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState({ loading: false, error: null });
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        (err) => {
          let errorMsg = "Failed to get location";
          if (err.code === err.PERMISSION_DENIED) errorMsg = "Permission denied";
          else if (err.code === err.POSITION_UNAVAILABLE) errorMsg = "Position unavailable";
          else if (err.code === err.TIMEOUT) errorMsg = "Timeout";
          
          setState({ loading: false, error: errorMsg });
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  return { ...state, getCurrentPosition };
}
