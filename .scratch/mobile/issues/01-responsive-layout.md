# 01: Responsive portrait/landscape layout

Status: ready-for-agent

Spec: `.scratch/mobile/spec.md`

## What

Today `.layout` in `src/style.css` is a fixed two-column grid (`minmax(0,1fr) 380px`) sized with `100vh`.

- Portrait (`orientation: portrait` and narrow width): make the grid rows instead, with the scene ~45% on top and the store ~55% below. The store scrolls internally, and the page itself never scrolls.
- Phone landscape: keep the two columns, and shrink `--store-width` as needed so the scene stays usable.
- Use `100dvh`, and respect `env(safe-area-inset-*)` (notch, home indicator). Add `viewport-fit=cover` to the viewport meta.
- Scale the counter, Pandora, News Ticker and the music/SFX/reset toggles to fit the smaller scene. Keep the Inversionista's hit area at least 44px.
- The modals (Memo, offline earnings, reset confirm) must fit at 360px.

## Acceptance

- At 360×740 portrait: no horizontal scroll, Pandora is fully visible and tappable, the store scrolls, and every modal fits.
- At 320px width: no horizontal scroll.
- At 740×360 landscape: the two columns are usable.
- The desktop layout is unchanged.

## Comments

**Implemented** (commits 98d0206, 0ed83fe; `src/style.css` and the viewport meta in `index.html` only):

- Portrait phones (`orientation: portrait` and `max-width: 760px`): a single column with rows `45fr / 55fr`. The scene is on top and the store scrolls inside the bottom row. The page never scrolls.
- Landscape phones (`orientation: landscape` and `max-height: 500px`): two columns, with `--store-width: min(320px, 45vw)`.
- Both phone orientations use a compact scene: a shorter News Ticker, a smaller counter and toggles, Pandora filling the height that's left, the Quote bubble anchored top-right, and the Inversionista at 96px wide (about 119px tall), which keeps it above the 44px minimum.
- `100dvh` with a `100vh` fallback, `viewport-fit=cover`, and `env(safe-area-inset-*)` exposed as `--safe-*` and applied to the scene, the store, the modal backdrop, the toasts and the Inversionista.
- Modals get less padding at ≤480px width or ≤500px height, `max-height: 90dvh`, and wrapping action buttons.
- Producer rows use `minmax(0, 1fr)` with `overflow-wrap: anywhere` so that long names can't widen the store.

**Verified** in headless Chromium (Playwright, touch emulation, DPR 2) against the Vite dev server at 360×740, 320×568, 390×844, 740×360, 844×390 and 1440×900. Each size was checked with the Memo (new game), the offline-earnings modal (seeded Stage 3 save, 1 h away, every Upgrade unlocked), the Quote bubble, a forced Inversionista, and the reset confirm:

- No horizontal scroll at any size (`scrollWidth == innerWidth`), and the page never scrolls vertically.
- Pandora sits fully inside the scene and can be clicked (Playwright's actionability check passed). She is 140×210 at 360×740 and 158×238 at 740×360.
- The store scrolls internally and has no horizontal overflow.
- Every modal fits inside the viewport. The long first Memo scrolls inside its card at 360×740 and 320×568.
- Desktop at 1440×900: all 66 measured element rects (scene, store, Pandora, counter, ticker, controls, modals, Inversionista) are identical to the base commit 3b91a14.
- Screenshots were reviewed by eye at 360 portrait, 320 portrait and 740 landscape.

**Pending / notes for later issues:**

- Not yet checked in DevTools device mode by hand, or on a real iPhone or Android (safe areas, dynamic toolbar and `dvh` behaviour, notch in landscape).
- At 320px, Pandora is small (about 65×97) and the three toggles wrap onto two rows. This is acceptable because 320px "need not look polished".
- The compact toggles are about 25px tall, which is small for touch. Issue 02 may want bigger targets.
- The hover tooltip (`src/ui/tooltip.ts`) opens to the left of the item, so in the full-width portrait store it is clamped to the left edge and covers the item. Touch details are issue 02's job.
- Short or narrow desktop windows (≤500px tall, or portrait and ≤760px wide) also get the compact layout. This is intentional: the old layout clipped Pandora there.
