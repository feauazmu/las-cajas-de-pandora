# 04: Installable PWA

Status: ready-for-agent

Spec: `.scratch/mobile/spec.md`

## What

- Add `vite-plugin-pwa` (a dev dependency). The Vite `base` is `"./"` and the site is served from a GitHub Pages subpath, so the manifest `start_url`/`scope` and the service worker scope must work from that subpath.
- Manifest: `name` "Las Cajas de Pandora", `short_name` "Pandora", `display: "standalone"`, `orientation: "portrait"`, theme and background colors from the palette in `src/style.css`, with 192/512 and maskable icons derived from `public/assets/img/pandora-1.png`. Add an `apple-touch-icon` and the iOS meta tags to `index.html`.
- Service worker: `registerType: "autoUpdate"`. Precache the app shell (HTML/JS/CSS) and all images. Music (`assets/music/*.mp3`) is not precached. Cache it with a CacheFirst runtime route on first fetch (music is loaded via `fetch` in `src/audio/music.ts`).
- Convert `bg-1..3.png` to WebP and update `STAGES` in `src/game/defs.ts`. Update `assets-manifest.json` if it references the file names.

## Acceptance

- Lighthouse reports the site as installable, and it installs on Android Chrome and via iOS "Add to Home Screen" with the label "Pandora".
- After one online visit, the game loads and plays in airplane mode. A Stage's music plays offline only if it was heard online before.
- Deploying a new build reaches installed players on their next launch, with no prompt, and their save is kept.
