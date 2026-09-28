# 02: Touch input

Status: ready-for-agent

Spec: `.scratch/mobile/spec.md`

## What

- **Pandora**: replace the `click` handler (`src/ui/scene.ts`) with `pointerdown`, so each touch point is one click. Keep keyboard activation, which currently goes through `click` with no pointer position (see the comment in `onPandoraClick`), and don't double-count a mouse click. Add `touch-action: manipulation`, `-webkit-touch-callout: none` and `user-select: none` on Pandora.
- **Input-mode module**: add a pure module (e.g. `src/ui/input.ts`) with vitest tests that decides:
  - coarse vs fine pointer (from `matchMedia("(pointer: coarse)")`, injected so it's testable)
  - long-press: fires after a hold threshold (~450ms) unless the pointer moved beyond a small distance (so scrolling the store never triggers it), and suppresses the tap that follows
- **Upgrades on coarse pointers**: a tap opens a detail card (name, effect, cost, flavor, and a **Comprar** button that uses the same buy path as today). Tapping outside it or on ✕ closes it. The card is Spanish text in `src/content/es.ts`.
- **Producers on coarse pointers**: a tap buys, as today. A long-press shows the existing tooltip content (with flavor) anchored so it stays on screen, and dismisses on release or the next tap.
- **Expansion card**: its tooltip info must be reachable on touch (long-press or inline).
- **Fine pointers**: the current hover/focus tooltips stay exactly as they are.

`src/ui/tooltip.ts` positions to the left of the target. On a narrow portrait layout it must clamp within the viewport, above or below the target.

## Acceptance

- vitest covers coarse/fine branching, the long-press threshold, cancelling on move, and suppressing the tap after a long-press.
- On a touch device: multi-finger taps on Pandora each add Croquetas, there's no double-tap zoom, and scrolling the store never buys or opens anything.
