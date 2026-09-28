import { el } from "./dom";

const PIXELS_PER_SECOND = 90;

/**
 * Scrolls one headline at a time across the bar. Stage headlines play in a
 * shuffled order without repeats until all have shown; pushed headlines
 * (Inversionista outcomes) jump the queue.
 */
export class Ticker {
  readonly root = el("div", "ticker");
  private readonly text = el("span", "ticker-text");
  private pool: readonly string[] = [];
  private bag: string[] = [];
  private priority: string[] = [];

  constructor() {
    this.root.setAttribute("aria-hidden", "true");
    this.root.append(this.text);
    this.text.addEventListener("animationend", () => this.next());
  }

  setHeadlines(headlines: readonly string[]): void {
    this.pool = headlines;
    this.bag = [];
    this.next();
  }

  pushFront(headline: string): void {
    this.priority.push(headline);
    this.next();
  }

  private draw(): string {
    const urgent = this.priority.shift();
    if (urgent) return urgent;
    if (this.bag.length === 0) this.bag = shuffle([...this.pool]);
    return this.bag.pop() ?? "";
  }

  private next(): void {
    // Widths are only measurable once mounted.
    if (!this.root.isConnected) {
      requestAnimationFrame(() => this.next());
      return;
    }
    this.text.textContent = this.draw();
    const distance = this.root.clientWidth + this.text.offsetWidth;
    this.text.style.setProperty("--from", `${this.root.clientWidth}px`);
    this.text.style.setProperty("--to", `${-this.text.offsetWidth}px`);
    this.text.style.animation = "none";
    void this.text.offsetWidth;
    this.text.style.animation = `ticker-scroll ${Math.max(distance, 400) / PIXELS_PER_SECOND}s linear`;
  }
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}
