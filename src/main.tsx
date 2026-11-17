import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";

// Confirm the JS bundle has initialized before the updater's rollback timeout.
if (Capacitor.isNativePlatform()) {
  void CapacitorUpdater.notifyAppReady();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
