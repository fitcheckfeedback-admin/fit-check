import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/swRegister";
import { setBaseUrl } from "@workspace/api-client-react";
import { isNative } from "./lib/platform";

const PROD_API = "https://api-production-9e7ca.up.railway.app";

if (isNative()) {
  setBaseUrl(PROD_API);

  const _fetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      input = `${PROD_API}${input}`;
    } else if (input instanceof Request && input.url.startsWith("/")) {
      input = new Request(`${PROD_API}${input.url}`, input);
    }
    return _fetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);

if (!isNative()) {
  registerServiceWorker();
}
