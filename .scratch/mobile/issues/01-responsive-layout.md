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
