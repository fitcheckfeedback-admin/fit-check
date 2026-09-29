import { QueryClient } from "@tanstack/react-query";

// Single shared react-query client for the app. Import this module (instead of
// constructing a new QueryClient) whenever code outside the React tree needs
// to interact with the cache, e.g. invalidating queries from native event
// listeners.
export const queryClient = new QueryClient();
