import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/swRegister";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA + push notifications
registerServiceWorker();
