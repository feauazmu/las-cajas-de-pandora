import { setMusicMuted } from "../audio/music";
import { setSfxMuted, sfx } from "../audio/sfx";
import { es } from "../content/es";
import { FRENZY_MULTIPLIER } from "../game/defs";
import type { Game } from "../game/engine";
import { formatCps, formatCroquetas } from "../format/number";
import { CROQUETA_IMG, INVERSIONISTA_IMG } from "./assets";
import { asset, el, pick } from "./dom";
import { burst, floatText, replayClass } from "./effects";
import { toast } from "./modals";
import { Ticker } from "./ticker";

const QUOTE_COOLDOWN_MS = 15_000;
const QUOTE_CHANCE = 0.1;
const QUOTE_VISIBLE_MS = 4_000;
const CROSSFADE_MS = 600;

export interface SceneCallbacks {
  onReset(): void;
}

/** The left column: ticker, background, counter, Pandora, Inversionista and controls. */
export class Scene {
  readonly root = el("main", "scene");
  readonly ticker = new Ticker();
  private readonly background = el("div", "scene-bg");
  private readonly counter = el("div", "counter-value");
  private readonly cpsLine = el("div", "counter-cps");
  private readonly frenzy = el("div", "frenzy");
  private readonly pandora = el("button", "pandora");
  private readonly bubble = el("div", "bubble");
  private readonly inversionista = el("button", "inversionista");
  private readonly effects = el("div", "effects");
  private readonly musicToggle = el("button", "btn btn-small");
  private readonly sfxToggle = el("button", "btn btn-small");
  private lastQuoteAt = -Infinity;
  private clickedThisSession = false;
  private bubbleTimer: ReturnType<typeof setTimeout> | undefined;
  private inversionistaShownAt: number | null = null;

  constructor(
    private readonly game: Game,
    callbacks: SceneCallbacks,
  ) {
    const counter = el("div", "counter");
    const unit = el("span", "counter-unit", ` ${es.ui.croquetasUnit}`);
    const icon = el("img", "counter-icon");
    icon.src = asset(CROQUETA_IMG);
    icon.alt = "";
    const main = el("div", "counter-main");
    main.append(icon, this.counter, unit);
    counter.append(main, this.cpsLine);

    this.pandora.setAttribute("aria-label", es.ui.pandoraAria);
    this.pandora.addEventListener("click", (e) => this.onPandoraClick(e));
    const pandoraArea = el("div", "pandora-area");
    pandoraArea.append(this.pandora, this.bubble);

    const invImg = el("img");
    invImg.src = asset(INVERSIONISTA_IMG);
    invImg.alt = "";
    this.inversionista.append(invImg);
    this.inversionista.hidden = true;
    this.inversionista.setAttribute("aria-label", es.ui.inversionistaAria);
    this.inversionista.addEventListener("click", () => this.onInversionistaClick());

    this.musicToggle.addEventListener("click", () => {
      this.game.updateSettings({ musicMuted: !this.game.state.settings.musicMuted });
      this.applySettings();
    });
    this.sfxToggle.addEventListener("click", () => {
      this.game.updateSettings({ sfxMuted: !this.game.state.settings.sfxMuted });
      this.applySettings();
    });
    const reset = el("button", "btn btn-small btn-danger", es.ui.reset);
    reset.addEventListener("click", () => callbacks.onReset());
    const controls = el("div", "controls");
    controls.append(this.musicToggle, this.sfxToggle, reset);

    this.frenzy.hidden = true;
    this.frenzy.setAttribute("aria-live", "polite");
    this.root.append(
      this.background,
      this.ticker.root,
      counter,
      this.frenzy,
      pandoraArea,
      this.inversionista,
      controls,
      this.effects,
    );
    this.showStage(false);
    this.applySettings();
  }

  /** Swaps the background and Pandora for the current Stage; crossfades unless `animate` is false. */
  showStage(animate = true): void {
    const stage = this.game.currentStage();
    crossfade(this.background, asset(stage.assets.background), animate, "bg");
    crossfade(this.pandora, asset(stage.assets.pandora), animate, "pandora-img");
    this.ticker.setHeadlines(es.stages[stage.id]?.tickerHeadlines ?? []);
  }

  /** Makes Pandora speak now, ignoring the cooldown (first click, after an Expansion). */
  sayQuote(): void {
    const stage = this.game.currentStage();
    const quotes = es.stages[stage.id]?.quotes ?? [];
    if (quotes.length === 0) return;
    this.lastQuoteAt = performance.now();
    this.bubble.textContent = pick(quotes);
    this.bubble.classList.add("visible");
    sfx.bark();
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => this.bubble.classList.remove("visible"), QUOTE_VISIBLE_MS);
  }

  /** Per-frame refresh. */
  update(now: number): void {
    const { state } = this.game;
    this.counter.textContent = formatCroquetas(state.croquetas);
    this.cpsLine.textContent = es.ui.perSecond(formatCps(this.game.cps()));

    const frenzyMs = this.game.frenzyRemainingMs();
    this.frenzy.hidden = frenzyMs <= 0;
    if (frenzyMs > 0) this.frenzy.textContent = es.ui.frenzyIndicator(Math.ceil(frenzyMs / 1000));
    this.root.classList.toggle("in-frenzy", frenzyMs > 0);

    const visit = this.game.inversionista();
    if (visit) {
      if (this.inversionistaShownAt !== visit.appearedAt) {
        this.inversionistaShownAt = visit.appearedAt;
        this.inversionista.hidden = false;
        sfx.inversionistaAppears();
      }
      const progress = (now - visit.appearedAt) / (visit.leavesAt - visit.appearedAt);
      this.inversionista.style.setProperty("--progress", String(progress));
    } else if (!this.inversionista.hidden) {
      this.inversionista.hidden = true;
    }
  }

  private applySettings(): void {
    const { musicMuted, sfxMuted } = this.game.state.settings;
    setMusicMuted(musicMuted);
    setSfxMuted(sfxMuted);
    this.musicToggle.textContent = musicMuted ? es.ui.musicOff : es.ui.musicOn;
    this.musicToggle.setAttribute("aria-pressed", String(!musicMuted));
    this.sfxToggle.textContent = sfxMuted ? es.ui.sfxOff : es.ui.sfxOn;
    this.sfxToggle.setAttribute("aria-pressed", String(!sfxMuted));
  }

  private onPandoraClick(e: MouseEvent): void {
    const gained = this.game.click();
    sfx.click();
    replayClass(this.pandora, "squash");
    const host = this.root.getBoundingClientRect();
    const target = this.pandora.getBoundingClientRect();
    // Keyboard activation has no pointer position; use Pandora's centre.
    const fromPointer = e.detail > 0;
    const x = (fromPointer ? e.clientX : target.left + target.width / 2) - host.left;
    const y = (fromPointer ? e.clientY : target.top + target.height / 2) - host.top;
    floatText(this.effects, x, y, `+${formatCroquetas(gained)}`);
    burst(this.effects, x, y);

    const first = !this.clickedThisSession;
    this.clickedThisSession = true;
    const cooledDown = performance.now() - this.lastQuoteAt >= QUOTE_COOLDOWN_MS;
    if (first || (cooledDown && Math.random() < QUOTE_CHANCE)) this.sayQuote();
  }

  private onInversionistaClick(): void {
    const outcome = this.game.clickInversionista();
    if (!outcome) return;
    this.inversionista.hidden = true;
    const content = es.inversionista[outcome.kind];
    if (outcome.kind === "frenzy") {
      toast(content.toast(String(FRENZY_MULTIPLIER)));
      sfx.frenzy();
    } else {
      toast(content.toast(formatCroquetas(outcome.amount)));
      sfx.lump();
    }
    this.ticker.pushFront(pick(content.headlines));
  }
}

function crossfade(host: HTMLElement, src: string, animate: boolean, className: string): void {
  const current = host.querySelector<HTMLImageElement>(`img.${className}`);
  if (current?.getAttribute("src") === src) return;
  const next = el("img", className);
  next.src = src;
  next.alt = "";
  next.draggable = false;
  if (!animate) {
    current?.remove();
    host.append(next);
    return;
  }
  next.style.opacity = "0";
  host.append(next);
  requestAnimationFrame(() => {
    next.style.opacity = "1";
    if (current) current.style.opacity = "0";
  });
  if (current) setTimeout(() => current.remove(), CROSSFADE_MS + 50);
}
