import { el } from "./dom";

export interface TooltipContent {
  title: string;
  lines: string[];
  flavor: string;
}

const tip = el("div", "tooltip");
tip.setAttribute("role", "tooltip");

/** Shows a tooltip for `target` built lazily by `content` (so it stays current). */
export function attachTooltip(target: HTMLElement, content: () => TooltipContent): void {
  const show = () => {
    const c = content();
    tip.replaceChildren(el("strong", "", c.title));
    for (const line of c.lines) tip.append(el("div", "", line));
    tip.append(el("em", "tooltip-flavor", c.flavor));
    if (!tip.isConnected) document.body.append(tip);
    const r = target.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const left = Math.max(8, r.left - t.width - 12);
    const top = Math.min(Math.max(8, r.top), window.innerHeight - t.height - 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.classList.add("visible");
  };
  const hide = () => tip.classList.remove("visible");
  target.addEventListener("mouseenter", show);
  target.addEventListener("mouseleave", hide);
  target.addEventListener("focus", show);
  target.addEventListener("blur", hide);
}
