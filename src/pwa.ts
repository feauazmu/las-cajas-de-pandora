/// <reference types="vite-plugin-pwa/vanillajs" />
// Registers the service worker that makes the game installable and playable offline.
// With registerType "autoUpdate" a new build installs in the background, takes over and
// reloads the page with no prompt; the "pagehide" handler in main.ts saves the game first.

import { registerSW } from "virtual:pwa-register";

/** Idle sessions can stay open for hours, so look for a new build now and then. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      if (navigator.onLine) registration.update().catch(() => {});
    }, UPDATE_CHECK_MS);
  },
});
