import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// The page background (the `background` of `:root` in src/style.css, not the `--paper` token),
// used for the splash screen and the status bar. index.html repeats it in its theme-color meta.
const PAGE_BG = "#f3e3cb";

// Relative base so the static build works from any path (GitHub Pages serves it from a subpath).
// Every PWA URL below is relative too: the manifest resolves against its own URL and the
// service worker registers with scope "./", so both follow whatever path the site is served from.
export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      // "prompt" leaves a new build waiting; src/pwa.ts registers the service worker and applies
      // the waiting build once the page is hidden, instead of reloading mid-play.
      registerType: "prompt",
      injectRegister: false,
      // The glob below already precaches the icons.
      includeManifestIcons: false,
      manifest: {
        id: "./",
        name: "Las Cajas de Pandora",
        short_name: "Pandora",
        description: "Haz clic en Pandora, produce croquetas veganas y convierte su cocina en un imperio.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        theme_color: PAGE_BG,
        background_color: PAGE_BG,
        icons: [
          { src: "assets/img/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "assets/img/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "assets/img/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell plus every image; music is left to the runtime route below. The plugin adds
        // the web manifest itself. pandora-ref.png is only a generation reference, not used in game.
        globPatterns: ["**/*.{html,js,css,png,webp,svg,ico}"],
        globIgnores: ["**/pandora-ref.png"],
        cleanupOutdatedCaches: true,
        // Without clientsClaim the first visit is uncontrolled and the music it plays isn't cached.
        // No skipWaiting: an update waits until src/pwa.ts applies it while the page is hidden.
        clientsClaim: true,
        runtimeCaching: [
          {
            // Each Stage's track is cached the first time it is fetched (src/audio/music.ts).
            urlPattern: ({ url }) => /\/assets\/music\/[^/]+\.mp3$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "music",
              expiration: { maxEntries: 10 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});
