"use client";

import { useEffect } from "react";

/**
 * Registers the placeholder service worker once on the client. Offline caching
 * strategies are layered in during a later phase; this only wires up the SW.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
