import { el } from "./dom";
import { isCoarsePointer, PressGesture } from "./input";
import { placePopup } from "./popup";

export interface TooltipContent {
  title: string;
  lines: string[];
  flavor: string;
}

const tip = el("div", "tooltip");
tip.setAttribute("role", "tooltip");

/** Fills `host` with a Store item's details: title, lines and flavor. */
export function renderDetails(host: HTMLElement, c: TooltipContent, titleClass = ""): void {
  host.replaceChildren(el("strong", titleClass, c.title));
  for (const line of c.lines) host.append(el("div", "", line));
  host.append(el("em", "tooltip-flavor", c.flavor));
}

function show(target: HTMLElement, c: TooltipContent, coarse: boolean): void {
  renderDetails(tip, c);
  if (!tip.isConnected) document.body.append(tip);
  const r = target.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const { left, top } = placePopup(r, t, viewport, coarse);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.classList.add("visible");
}

export function hideTooltip(): void {
  tip.classList.remove("visible");
}

/**
 * Shows a tooltip for `target` built lazily by `content` (so it stays current).
 * Fine pointers get it on hover and focus. Coarse pointers get it on a
 * long-press, until the finger lifts; the click that ends a long-press, or a
 * drag across the item, is swallowed so it never buys anything.
 */
export function attachTooltip(target: HTMLElement, content: () => TooltipContent): void {
  target.addEventListener("mouseenter", () => {
    if (!isCoarsePointer()) show(target, content(), false);
  });
  target.addEventListener("mouseleave", hideTooltip);
  target.addEventListener("focus", () => {
    // A tap focuses the button too; only keyboard focus should show the tooltip there.
    if (!isCoarsePointer() || target.matches(":focus-visible")) show(target, content(), false);
  });
  target.addEventListener("blur", hideTooltip);

  const press = new PressGesture({
    onLongPress: () => show(target, content(), true),
    onLongPressEnd: hideTooltip,
  });
  target.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || !e.isPrimary || !isCoarsePointer()) return;
    hideTooltip();
    press.down(e.clientX, e.clientY);
  });
  target.addEventListener("pointermove", (e) => {
    if (e.isPrimary) press.move(e.clientX, e.clientY);
  });
  target.addEventListener("pointerup", (e) => {
    if (e.isPrimary) press.up();
  });
  target.addEventListener("pointercancel", (e) => {
    if (e.isPrimary) press.cancel();
  });
  // The system long-press menu (Android) would cover the tooltip.
  target.addEventListener("contextmenu", (e) => {
    if (isCoarsePointer()) e.preventDefault();
  });
  // Capture phase, so this runs before the item's own click (buy) handler
  // when the click lands on a child. When it lands on the item itself, older
  // engines run listeners in registration order, so callers attach the
  // tooltip before their click handler.
  target.addEventListener(
    "click",
    (e) => {
      if (press.takeClick()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    { capture: true },
  );
}
