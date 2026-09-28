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

## Comments

**Implemented** (commits af77dd4, 4b1c219):

- `src/ui/input.ts` (pure, 15 vitest tests in `input.test.ts`): `isCoarsePointer(matchMedia)` and `PressGesture`, with injected timers. A long-press fires after 450 ms (`LONG_PRESS_MS`) and is cancelled by moving more than 10 px (`TAP_SLOP_PX`), by lifting early, or by `pointercancel`. `takeClick()` swallows the one click that follows a long-press or a drag, and doesn't keep a stale suppression after a cancelled press.
- `src/ui/popup.ts` (pure, 7 tests in `popup.test.ts`): `placePopup`. On a fine pointer with room on the left it keeps the old desktop placement exactly. On a coarse pointer, or when there's no room on the left (a full-width portrait store), it places the popup above the item, or below it when there's no room above. It centres the popup on the item and clamps it inside the viewport.
- Pandora (`scene.ts`): each pointer counts on `pointerdown`, so multi-finger taps all count. A right mouse button doesn't count. `click` counts only for the keyboard (`detail === 0`) or for a click with no pointer activity in the previous second (screen-reader activation). This avoids counting a pointer twice. The CSS adds `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none` and a transparent tap highlight.
- Tooltips (`tooltip.ts`): on fine pointers, hover and focus behave as before. On coarse pointers, the emulated `mouseenter` after a tap no longer shows the tooltip, and a tap's focus doesn't either (only `:focus-visible` does). A long-press shows the tooltip above or below the item and hides it on release. The click after a long-press or a drag is swallowed in the capture phase, and `contextmenu` is suppressed. Store items attach the tooltip before their buy handler, so the guard runs first in every engine.
- Upgrades on coarse pointers: a tap opens a detail card (`detail.ts`) anchored above or below the Upgrade. It shows the name, effect, cost, flavor, a ✕ (aria-label "Cerrar", in `es.ts`) and **Comprar**, which uses the same `buyUpgrade` path as a desktop click. Tapping the dimmed backdrop, ✕ or Escape closes the card, and the backdrop swallows that tap. Comprar is `aria-disabled` when the Upgrade is unaffordable; tapping it anyway plays the denied sound and the card stays open. The card refreshes from `Store.update()`, but only re-renders and repositions when its content changes. It also repositions on resize and traps Tab.
- Producers on coarse pointers: a tap buys, and a long-press shows the tooltip with flavor.
- Expansion: a long-press shows its tooltip, and on coarse pointers its flavor is also shown inline (`.expansion-flavor`, hidden on fine pointers).
- The compact scene toggles are now 32 px tall (up from 25 px), and a `::before` extends their hit area to 44 px. When they wrap (below 360 px), the row gap is 12 px so the enlarged hit areas don't overlap. The only new media query is `(pointer: coarse)`, which is a capability query, not a breakpoint.

**Verified** with `npm test` (94 tests), `npm run build`, and a Playwright script against the Vite dev server in headless Chromium. The script uses touch emulation (`isMobile`, `hasTouch`, DPR 2), with taps and multi-touch sent through CDP `Input.dispatchTouchEvent`, and scrolls through `Input.synthesizeScrollGesture` (touch source). 43/43 checks passed:

- 360×740 portrait:
  - A single tap adds 1 Croqueta. A three-finger tap adds 3. A rapid double tap adds 2 and leaves `visualViewport.scale` at 1. A click with no pointer events (AT-style) adds 1.
  - The toggles hit-test over 44 px (`elementFromPoint`), and a tap 3 px above the music toggle toggles it.
  - Tapping an Upgrade opens the card within the viewport and doesn't buy. Tapping outside, ✕ and Escape each close it. An unaffordable Comprar is disabled and keeps the card open. Comprar buys (−100) and closes the card. Tab stays inside the card.
  - Tapping a Producer buys it. A 650 ms long-press shows the tooltip with flavor, inside the viewport and not covering the row. The long-press doesn't buy, and releasing hides the tooltip.
  - A long-press on the Expansion shows its flavor, and the flavor is also shown inline.
  - Drags starting on Upgrades and Producers, fast and slow (the slow one held past 450 ms), never buy, open or show anything. On a Stage 3 store, 4/4 scroll gestures really scrolled it.
  - No horizontal scroll.
- 740×360 landscape: the card opens within the viewport.
- 1440×900 desktop (mouse):
  - A mouse click on Pandora adds exactly 1, and a right click adds nothing. Enter and Space add 1 each.
  - The hover tooltip is placed exactly as before (12 px left of the row, top-aligned) and hides on leave. Focus shows it. Enter on a Producer buys it.
  - Clicking an Upgrade buys it directly, with no card. The Expansion flavor isn't shown inline.
- I reviewed screenshots of the card and the long-press tooltip at 360×740 by eye.

**Pending (needs real devices):**

- iPhone Safari and Android Chrome:
  - Multi-finger taps, no double-tap zoom, and no callout or selection on a long-press on Pandora or Store items.
  - A real finger scroll of the store never buys. Headless Chromium emulates this, but iOS pointer-event timing may differ.
  - The long-press threshold feels right.
- VoiceOver and TalkBack activation of Pandora and the card. Only an emulated click was tested.
- Not done by design: pinch-zoom is still allowed (`touch-action: manipulation`), since the spec only asks to disable double-tap zoom. A scroll that starts on Pandora counts as a click, but the scene never scrolls. On hybrid touch laptops (primary pointer fine), taps behave like desktop clicks.
