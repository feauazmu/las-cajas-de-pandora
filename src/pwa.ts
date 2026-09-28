/// <reference types="vite-plugin-pwa/vanillajs" />
// Registers the service worker that makes the game installable and playable offline.
// A new build downloads in the background and waits; it is applied (with a reload) only once
// the page is hidden, so an update never interrupts visible play. main.ts saves on hide first.

import { registerSW } from "virtual:pwa-register";

/** Idle sessions can stay open for hours, so look for a new build now and then. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

let updateReady = false;
let applying = false;

function applyUpdateIfHidden(): void {
  if (!updateReady || applying || document.visibilityState !== "hidden") return;
  applying = true;
  // The plugin only reloads when the page already had a controller at load; the first
  // session after install doesn't, and must not keep running old code on new caches.
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), {
    once: true,
  });
  void updateSW();
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateReady = true;
    // The hourly check can find a build while the page is already in the background.
    applyUpdateIfHidden();
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      // A failed check (offline, flaky network) is harmless: the next one retries.
      if (navigator.onLine) registration.update().catch(() => {});
    }, UPDATE_CHECK_MS);
  },
});

document.addEventListener("visibilitychange", applyUpdateIfHidden);
