import { describe, expect, it } from "vitest";
import { placePopup } from "./popup";

const desktop = { width: 1440, height: 900 };
const phone = { width: 360, height: 740 };
const tip = { width: 240, height: 100 };

describe("placePopup", () => {
  it("keeps the desktop placement: left of the Store item, 12 px away, top-aligned", () => {
    const target = { left: 1080, top: 300, width: 340, height: 60 };
    expect(placePopup(target, tip, desktop, false)).toEqual({ left: 828, top: 300 });
  });

  it("keeps the desktop clamp of the top edge to the viewport", () => {
    const target = { left: 1080, top: 850, width: 340, height: 40 };
    expect(placePopup(target, tip, desktop, false)).toEqual({ left: 828, top: 792 });
  });

  it("goes above the item when there's no room on its left (full-width portrait store)", () => {
    const target = { left: 10, top: 500, width: 340, height: 60 };
    // Centred on the item: 10 + 170 - 120 = 60; above it: 500 - 100 - 12 = 388.
    expect(placePopup(target, tip, phone, false)).toEqual({ left: 60, top: 388 });
  });

  it("goes above the item on a coarse pointer even with room on the left, so the finger doesn't hide it", () => {
    const target = { left: 1080, top: 300, width: 340, height: 60 };
    expect(placePopup(target, tip, desktop, true)).toEqual({ left: 1130, top: 188 });
  });

  it("goes below the item when there's no room above", () => {
    const target = { left: 10, top: 60, width: 340, height: 60 };
    expect(placePopup(target, tip, phone, true)).toEqual({ left: 60, top: 132 });
  });

  it("clamps horizontally inside the viewport with an 8 px margin", () => {
    const small = { left: 300, top: 500, width: 52, height: 52 };
    expect(placePopup(small, tip, phone, true).left).toBe(360 - 240 - 8);
    const edge = { left: 0, top: 500, width: 52, height: 52 };
    expect(placePopup(edge, tip, phone, true).left).toBe(8);
  });

  it("stays inside the viewport when it fits neither above nor below", () => {
    const tall = { width: 240, height: 400 };
    const target = { left: 10, top: 300, width: 340, height: 60 };
    const { top } = placePopup(target, tall, phone, true);
    expect(top).toBeGreaterThanOrEqual(8);
    expect(top + 400).toBeLessThanOrEqual(740 - 8);
  });
});
