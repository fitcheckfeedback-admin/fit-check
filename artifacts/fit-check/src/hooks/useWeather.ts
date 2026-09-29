import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "../lib/weather";
import { LocationData } from "../lib/storage";

export function useWeather(location: LocationData | null) {
  return useQuery({
    queryKey: ["weather", location?.lat, location?.lon],
    queryFn: async () => {
      if (!location) throw new Error("No location provided");
      // Never fall back to mock data: a failed fetch must surface as an error
      // so the UI shows a retry state instead of a fake forecast.
      return await fetchForecast(location.lat, location.lon);
    },
    enabled: !!location,
    staleTime: 0,                          // always treat data as stale
    refetchInterval: 5 * 60 * 1000,       // background refresh every 5 min
    refetchOnWindowFocus: true,            // refresh when user returns to app
    refetchOnReconnect: true,             // refresh when connection restores
    gcTime: 10 * 60 * 1000,               // keep cache for 10 min between sessions
  });
}
