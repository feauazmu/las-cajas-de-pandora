# 03: Audio and haptics on mobile

Status: ready-for-agent

Spec: `.scratch/mobile/spec.md`

## What

- On `visibilitychange`, call `suspend()` on the shared AudioContext (`src/audio/context.ts`) when hidden and `resume()` when visible. This applies on all platforms. The existing save/catch-up logic in `src/main.ts` stays.
- Where `navigator.audioSession` exists (Safari), set `type = "ambient"` before creating the AudioContext.
- Haptics: `navigator.vibrate` (feature-detected) with a short pattern when an Inversionista is clicked and when an Expansion is bought, only when SFX are not muted.

## Acceptance

- On Android, switching apps or locking the screen stops the music, and returning resumes it.
- On an iPhone with the silent switch on, the game is silent, and a podcast playing alongside keeps playing.
- The Inversionista and Expansion vibrate on Android when SFX are on, and don't vibrate when SFX are muted.

## Comments

**Implemented** (commits `1ad7380`, `ece247b`):

- `src/audio/context.ts`: `unlockAudioOnFirstGesture()` now also registers a `visibilitychange` listener. It suspends the shared AudioContext when the page is hidden and resumes it when the page is visible, on all platforms. The resume/suspend helpers don't check `state === "running"`. That's deliberate: `state` only updates once a pending call settles, so a quick hide-and-return would otherwise leave the context suspended. Rejections are swallowed, and the next gesture retries the resume. Gestures don't resume the context while the page is hidden, and Safari's `"interrupted"` state is resumed too. `navigator.audioSession.type = "ambient"` is set, where the API exists, right before `new AudioContext()`.
- `src/audio/sfx.ts`: haptics live here rather than in `ui/scene.ts` or `ui/store.ts`, to avoid merge conflicts with parallel mobile work. `sfx.frenzy()` and `sfx.lump()` fire only on an Inversionista click, and `sfx.fanfare()` fires only when an Expansion is bought. Each of them calls `vibrate()`, which is gated by the SFX `muted` flag and feature-detects `navigator.vibrate`. The patterns are 40 ms for the Inversionista and `[60, 60, 120]` for the Expansion.
- The save/catch-up `visibilitychange` handler in `src/main.ts` is unchanged, and `main.ts` was not touched.

**Verified:**

- `npm test` passes (72 tests) and `npm run build` passes (`tsc` plus vite).
- In code review, I traced the call sites. The three sfx functions are called only from the Inversionista click (`scene.ts`) and the Expansion hook (`main.ts`). The muted flag is set from saved settings in the `Scene` constructor before any click. The ambient session is set before the only `new AudioContext()`.
- I didn't add unit tests. The change is thin browser-API glue with no pure logic to pull out.

**Pending (needs real devices):**

- Android: switching apps or locking the screen stops the music, and returning resumes it.
- iPhone with the silent switch on: the game is silent, and a podcast playing alongside keeps playing.
- Android: the Inversionista and Expansion vibrate when SFX are on and don't vibrate when SFX are muted.

**Code review:** fixed the suspend/resume race on quick app switches, renamed `useAmbientAudioSession` to `setAmbientAudioSession`, added a symmetric `suspend` helper, typed the `audioSession.type` union, and named the vibration patterns with `VibratePattern`. I rejected renaming `unlockAudioOnFirstGesture`, because that would edit `main.ts`, which is outside this issue's files. Its doc comment now describes the visibility handling instead.
