// One AudioContext for the whole game, created on the first user gesture so
// the browser's autoplay policy never blocks or warns. It is suspended while
// the page is hidden, so music stops when the phone locks or switches apps.

let ctx: AudioContext | null = null;
const listeners: ((ctx: AudioContext) => void)[] = [];

export function audioContext(): AudioContext | null {
  return ctx;
}

/** Runs `fn` once the context exists (immediately if it already does). */
export function onAudioReady(fn: (ctx: AudioContext) => void): void {
  if (ctx) fn(ctx);
  else listeners.push(fn);
}

/** Safari's Audio Session API; not in TypeScript's DOM types yet. */
interface AudioSessionNavigator {
  audioSession?: { type: string };
}

/**
 * "ambient" makes the game obey the iOS silent switch and mix with other
 * audio (a podcast keeps playing). Must be set before the context is created.
 */
function useAmbientAudioSession(): void {
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) session.type = "ambient";
}

function resume(audio: AudioContext): void {
  // Safari also reports "interrupted" (after a call or Siri).
  if (audio.state !== "running" && audio.state !== "closed") {
    audio.resume().catch(() => {
      // Retried on the next gesture.
    });
  }
}

export function unlockAudioOnFirstGesture(): void {
  const unlock = () => {
    if (!ctx) {
      useAmbientAudioSession();
      ctx = new AudioContext();
      for (const fn of listeners.splice(0)) fn(ctx);
    }
    if (!document.hidden) resume(ctx);
  };
  for (const type of ["pointerdown", "keydown"] as const) {
    window.addEventListener(type, unlock, { capture: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) {
      if (ctx.state === "running") {
        ctx.suspend().catch(() => {
          // Already closed or suspending; nothing to do.
        });
      }
    } else {
      resume(ctx);
    }
  });
}
