// Where a tooltip or popup goes relative to its Store item. Pure, so the
// geometry can be unit tested without a DOM.

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

const MARGIN = 8;
const GAP = 12;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/**
 * Left of the item (the desktop placement) when that fits and the pointer is
 * fine. Otherwise above the item, or below it when there's no room above,
 * centred on it and kept inside the viewport.
 */
export function placeTooltip(
  target: Rect,
  tip: Size,
  viewport: Size,
  coarse: boolean,
): { left: number; top: number } {
  const leftOfTarget = target.left - tip.width - GAP;
  if (!coarse && leftOfTarget >= MARGIN) {
    return {
      left: leftOfTarget,
      top: Math.min(Math.max(MARGIN, target.top), viewport.height - tip.height - MARGIN),
    };
  }

  const left = clamp(
    target.left + target.width / 2 - tip.width / 2,
    MARGIN,
    viewport.width - tip.width - MARGIN,
  );
  const above = target.top - tip.height - GAP;
  const below = target.top + target.height + GAP;
  const roomAbove = target.top - GAP - MARGIN;
  const roomBelow = viewport.height - (target.top + target.height) - GAP - MARGIN;
  let top: number;
  if (tip.height <= roomAbove) top = above;
  else if (tip.height <= roomBelow) top = below;
  else top = roomAbove >= roomBelow ? above : below;
  return { left, top: clamp(top, MARGIN, viewport.height - tip.height - MARGIN) };
}
