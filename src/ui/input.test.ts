import { describe, expect, it } from "vitest";
import { isCoarsePointer, PressGesture, type Timers } from "./input";

const media = (coarse: boolean) => (query: string) => ({
  matches: query === "(pointer: coarse)" && coarse,
});

describe("isCoarsePointer", () => {
  it("is true when the primary pointer is coarse (a phone's finger)", () => {
    expect(isCoarsePointer(media(true))).toBe(true);
  });

  it("is false for a fine pointer (a mouse)", () => {
    expect(isCoarsePointer(media(false))).toBe(false);
  });

  it("is false when matchMedia is unavailable", () => {
    expect(isCoarsePointer(undefined)).toBe(false);
  });
});

/** Manual clock: timers fire only when the test advances time. */
function fakeTimers() {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; fn: () => void }>();
  const timers: Timers = {
    setTimeout(fn, ms) {
      const id = nextId++;
      pending.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id as number);
    },
  };
  const advance = (ms: number) => {
    now += ms;
    for (const [id, t] of [...pending]) {
      if (t.at <= now) {
        pending.delete(id);
        t.fn();
      }
    }
  };
  return { timers, advance };
}

function setup() {
  const clock = fakeTimers();
  const events: string[] = [];
  const press = new PressGesture({
    timers: clock.timers,
    onLongPress: () => events.push("longpress"),
    onLongPressEnd: () => events.push("end"),
  });
  return { press, events, advance: clock.advance };
}

describe("PressGesture long-press", () => {
  it("fires once the finger has been held for 450 ms", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    advance(449);
    expect(events).toEqual([]);
    advance(1);
    expect(events).toEqual(["longpress"]);
  });

  it("does not fire if the finger lifts before the threshold", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    advance(300);
    press.up();
    advance(1000);
    expect(events).toEqual([]);
  });

  it("is cancelled when the finger moves more than 10 px (a scroll)", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    press.move(100, 111);
    advance(1000);
    expect(events).toEqual([]);
  });

  it("tolerates a small wobble of the finger", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    press.move(106, 107);
    advance(450);
    expect(events).toEqual(["longpress"]);
  });

  it("is cancelled when the browser takes over the pointer", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    press.cancel();
    advance(1000);
    expect(events).toEqual([]);
  });

  it("reports the end of a long-press when the finger lifts or is cancelled", () => {
    const { press, events, advance } = setup();
    press.down(100, 100);
    advance(450);
    press.up();
    press.down(100, 100);
    advance(450);
    press.cancel();
    expect(events).toEqual(["longpress", "end", "longpress", "end"]);
  });
});

describe("PressGesture tap", () => {
  it("lets a quick tap through as a click", () => {
    const { press, advance } = setup();
    press.down(100, 100);
    advance(120);
    press.up();
    expect(press.takeClick()).toBe(true);
  });

  it("lets a keyboard activation (no press at all) through", () => {
    const { press } = setup();
    expect(press.takeClick()).toBe(true);
  });

  it("swallows the click that follows a long-press, and only that one", () => {
    const { press, advance } = setup();
    press.down(100, 100);
    advance(600);
    press.up();
    expect(press.takeClick()).toBe(false);
    expect(press.takeClick()).toBe(true);
  });

  it("swallows the click that ends a drag, so scrolling never buys", () => {
    const { press, advance } = setup();
    press.down(100, 100);
    press.move(100, 60);
    advance(100);
    press.up();
    expect(press.takeClick()).toBe(false);
  });

  it("does not hold a stale suppression after a cancelled press", () => {
    const { press, advance } = setup();
    press.down(100, 100);
    press.move(100, 40);
    press.cancel();
    advance(100);
    expect(press.takeClick()).toBe(true);
  });

  it("clears the previous press's suppression when a new press starts", () => {
    const { press, advance } = setup();
    press.down(100, 100);
    advance(600);
    press.up();
    press.down(100, 100);
    press.up();
    expect(press.takeClick()).toBe(true);
  });
});
