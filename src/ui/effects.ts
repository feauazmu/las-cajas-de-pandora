import { CROQUETA_IMG } from "./assets";
import { asset, el } from "./dom";

/** "+N" that drifts up from the cursor and fades. */
export function floatText(host: HTMLElement, x: number, y: number, text: string): void {
  const node = el("div", "float-text", text);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  host.append(node);
  node.addEventListener("animationend", () => node.remove());
}

/** A few croquetas bursting out from a point. */
export function burst(host: HTMLElement, x: number, y: number, count = 6): void {
  for (let i = 0; i < count; i++) {
    const img = el("img", "particle");
    img.src = asset(CROQUETA_IMG);
    img.alt = "";
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    img.style.setProperty("--dy", `${Math.sin(angle) * distance - 30}px`);
    img.style.setProperty("--rot", `${Math.random() * 360}deg`);
    host.append(img);
    img.addEventListener("animationend", () => img.remove());
  }
}

/** Restarts a one-shot CSS animation class. */
export function replayClass(node: HTMLElement, className: string): void {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}
