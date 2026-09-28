// One AudioContext for the whole game, created on the first user gesture so
// the browser's autoplay policy never blocks or warns.

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

export function unlockAudioOnFirstGesture(): void {
  const unlock = () => {
    if (!ctx) {
      ctx = new AudioContext();
      for (const fn of listeners.splice(0)) fn(ctx);
    }
    if (ctx.state === "suspended") void ctx.resume();
  };
  for (const type of ["pointerdown", "keydown"] as const) {
    window.addEventListener(type, unlock, { capture: true });
  }
}
