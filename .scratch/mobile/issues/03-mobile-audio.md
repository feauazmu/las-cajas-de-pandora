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
