# Spec: Mobile support

Status: ready-for-agent

Make Las Cajas de Pandora comfortable to play on phones, and installable as a PWA. The MVP spec (`.scratch/mvp/spec.md`) listed mobile/touch as out of scope. This spec lifts that. Read `CONTEXT.md` for domain terms.

## Decisions

- **Platform**: responsive web plus an installable PWA, served from the existing GitHub Pages deploy. No app-store builds.
- **No WebAssembly.** The engine is a few multiplications per tick. The mobile costs are layout, touch, DOM/CSS animation, assets and battery, and WASM can't touch any of those. The code stays in TypeScript.
- **Orientation**: portrait-first. Phone landscape reuses the desktop two-column layout (with a narrower Store where needed).
- **Minimum width**: 360px is designed for. 320px must not break (no horizontal scroll) but need not look polished.
- **Portrait layout**: fixed split. The scene (ticker, counter, Pandora, toggles) is on top (~45%) and the store scrolls below (~55%).
- **Clicking Pandora**: every touch point counts as a click, fired on `pointerdown`. Double-tap zoom and the long-press callout/selection are disabled on Pandora.
- **Item details on touch** (coarse pointer only; desktop hover tooltips are unchanged):
  - Upgrade: a tap opens a detail card (name, effect, cost, flavor) with a **Comprar** button. No blind buys.
  - Producer: a tap buys it (cost and output are already inline), and a long-press shows its flavor.
  - Expansion: its details are shown the same way as an Upgrade's, or inline. The existing buy button stays.
- **Audio**: suspend the AudioContext when the page is hidden and resume it when visible, on all platforms. Set `navigator.audioSession.type = "ambient"` where supported, so the game respects the iOS silent switch and mixes with other audio.
- **Haptics**: `navigator.vibrate` only when an Inversionista is clicked and when an Expansion is bought, gated by the SFX toggle. iOS ignores it.
- **PWA**: `name` "Las Cajas de Pandora", `short_name` "Pandora", with icons derived from `pandora-1.png`. Precache the app shell and images, and cache each music track at runtime on first play. The service worker updates silently (auto-update, no prompt).
- **Assets**: convert the three Stage backgrounds to WebP.
- **Verification**: the touch-input decisions (coarse vs fine pointer, long-press timing, the tap-vs-scroll threshold) live in a pure module with vitest tests. Layout is checked by hand in DevTools device mode (360×740 portrait, plus landscape) and on one real iPhone and one real Android.

## Issues

Do these in order. Layout comes first because the rest need a usable phone screen to test on.

1. `issues/01-responsive-layout.md`
2. `issues/02-touch-input.md`
3. `issues/03-mobile-audio.md`
4. `issues/04-pwa.md`
