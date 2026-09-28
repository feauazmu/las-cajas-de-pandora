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
  audioSession?: {
    type: "auto" | "playback" | "transient" | "transient-solo" | "ambient" | "play-and-record";
  };
}

/**
 * "ambient" makes the game obey the iOS silent switch and mix with other
 * audio (a podcast keeps playing). Must be set before the context is created.
 */
function setAmbientAudioSession(): void {
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) session.type = "ambient";
}

// Neither helper checks for "running"/"suspended": `state` only changes once
// a pending suspend/resume settles, so a quick hide-and-return would be missed.
// The calls queue in order, and a redundant one is a no-op.

function resume(audio: AudioContext): void {
  if (audio.state === "closed") return;
  audio.resume().catch(() => {
    // Retried on the next gesture.
  });
}

function suspend(audio: AudioContext): void {
  if (audio.state === "closed") return;
  audio.suspend().catch(() => {
    // Nothing to stop.
  });
}

/**
 * Creates the context on the first gesture, and from then on suspends it
 * while the page is hidden and resumes it when visible.
 */
export function unlockAudioOnFirstGesture(): void {
  const unlock = () => {
    if (!ctx) {
      setAmbientAudioSession();
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
    if (document.hidden) suspend(ctx);
    else resume(ctx);
  });
}
