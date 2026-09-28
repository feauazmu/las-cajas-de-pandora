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

## Comments

### What was implemented

- `vite-plugin-pwa` is the only new devDependency, configured in `vite.config.ts`. The manifest has `name`, `short_name` "Pandora", `display: standalone` and `orientation: portrait`. Theme and background colors are `#f3e3cb`, the page background in `src/style.css`. `id`, `start_url` and `scope` are all `"./"`, and the icon `src`s are relative, so everything resolves against the manifest URL and works under the GitHub Pages subpath.
- The service worker is generated with `generateSW` and registered from `src/pwa.ts` (`virtual:pwa-register`, `registerType: "autoUpdate"`). It is loaded as a second module script in `index.html`, so `src/main.ts` is untouched. It registers `./sw.js` with scope `./`. `skipWaiting` and `clientsClaim` are set explicitly, because the plugin only sets them when it injects the registration itself. A new build installs in the background and reloads the page with no prompt; the `pagehide` save in `main.ts` keeps progress. `src/pwa.ts` also checks for a new build hourly, since idle sessions stay open for a long time.
- Precache covers HTML, JS, CSS and every image in `public/assets/img` (29 entries, about 1.2 MB). The one exception is `pandora-ref.png`, a generation reference that the game never shows. Music is not precached. A `CacheFirst` runtime route (cache `music`) matches `/assets/music/*.mp3`, so each track is cached the first time `src/audio/music.ts` fetches it.
- Icons derived from `pandora-1.png` (a head-and-shoulders crop on `#f3e3cb`): `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (a wider crop, with the face inside the safe zone) and `apple-touch-icon.png` (180). `index.html` gained `apple-touch-icon`, `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` "Pandora" and `apple-mobile-web-app-status-bar-style`. The viewport line was not changed.
- The backgrounds are now `bg-1..3.webp`, lossy at quality 92. PSNR against the 256-colour PNGs is 37–39 dB, and they look the same side by side at 1:1. Each is about 60–70% smaller (160–210 KB vs 440–590 KB). `STAGES` (`src/game/defs.ts`) and `assets-manifest.json` point to the WebP files, and the PNGs are deleted. `assets-manifest.json` also gained a `derivedAssets` list describing the icons.
- The icons and WebP files were generated once with `sharp` (installed in a scratch directory, not in the project) and committed. The build and CI need no image tooling.

### Verified

- `npm test` (72 tests) and `npm run build` pass.
- In `dist/`: the manifest, `sw.js`, the precache list (every image, no mp3) and relative paths (`./manifest.webmanifest`, `./sw.js` with scope `./`).
- Headless Chrome (puppeteer-core), with `dist/` served from `/las-cajas-de-pandora/` to mimic Pages:
  - The service worker registers with scope `…/las-cajas-de-pandora/` and controls the page on the first visit.
  - `Page.getAppManifest` reports no errors, and `Page.getInstallabilityErrors` is empty.
- Offline, with the server stopped and the browser offline:
  - A reload renders the game with its background, Pandora and all Producer images.
  - `stage-1.mp3`, fetched once while online, is served from the `music` cache. `stage-2.mp3`, never fetched, fails as expected.
  - `localStorage` is kept.
- Update: after a change to `sw.js` and `registration.update()`, the page reloads once by itself with no prompt, and the save (`lcdp.save.v1`) is still there.

### Pending (needs real devices / the deployed site)

- Lighthouse on the deployed GitHub Pages site.
- Installing on a real Android (Chrome) and via iOS "Add to Home Screen": check the "Pandora" label and how the icon looks (maskable crop, iOS icon).
- Airplane mode on a device, including music offline after it was heard online.
- A real deploy reaching an installed app on its next launch.
