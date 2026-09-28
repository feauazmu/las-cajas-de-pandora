// Touch-input decisions, kept free of the DOM so they can be unit tested:
// which pointer the device uses, and how a press on a Store item is read
// (a tap, a long-press, or a scroll that must do nothing).

export type MatchMedia = (query: string) => { readonly matches: boolean };

const defaultMatchMedia: MatchMedia | undefined =
  typeof matchMedia === "function" ? (query) => matchMedia(query) : undefined;

/** True when the primary pointer is coarse (a finger), so hover tooltips can't be used. */
export function isCoarsePointer(media: MatchMedia | undefined = defaultMatchMedia): boolean {
  return media?.("(pointer: coarse)").matches ?? false;
}

/** How long a finger must stay down before a press becomes a long-press. */
export const LONG_PRESS_MS = 450;

/** How far a finger may drift and still count as a tap or a long-press, not a scroll. */
export const TAP_SLOP_PX = 10;

export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const defaultTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface PressGestureOptions {
  onLongPress(): void;
  /** Called when the finger that made a long-press lifts or is cancelled. */
  onLongPressEnd?(): void;
  timers?: Timers;
}

/**
 * Reads one pointer's press on a Store item: a tap, a long-press, or a drag
 * (a scroll). Feed it the pointer events, and ask `takeClick()` from the
 * click handler whether the click that follows should act.
 */
export class PressGesture {
  private readonly timers: Timers;
  private timer: unknown = null;
  private start: { x: number; y: number } | null = null;
  private longPressed = false;
  private moved = false;
  private swallowClick = false;

  constructor(private readonly options: PressGestureOptions) {
    this.timers = options.timers ?? defaultTimers;
  }

  down(x: number, y: number): void {
    this.finish();
    this.swallowClick = false;
    this.moved = false;
    this.start = { x, y };
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      this.longPressed = true;
      this.options.onLongPress();
    }, LONG_PRESS_MS);
  }

  move(x: number, y: number): void {
    if (!this.start || this.moved) return;
    if (Math.hypot(x - this.start.x, y - this.start.y) > TAP_SLOP_PX) {
      this.moved = true;
      this.stopTimer();
    }
  }

  up(): void {
    if (this.start) this.swallowClick = this.longPressed || this.moved;
    this.finish();
  }

  /** The browser took the pointer over (usually to scroll); no click follows. */
  cancel(): void {
    this.swallowClick = false;
    this.finish();
  }

  /**
   * Call from the click handler. False means the click ends a long-press or
   * a drag and must do nothing. Answers once per press.
   */
  takeClick(): boolean {
    const act = !this.swallowClick;
    this.swallowClick = false;
    return act;
  }

  private finish(): void {
    this.stopTimer();
    this.start = null;
    if (this.longPressed) {
      this.longPressed = false;
      this.options.onLongPressEnd?.();
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) this.timers.clearTimeout(this.timer);
    this.timer = null;
  }
}
