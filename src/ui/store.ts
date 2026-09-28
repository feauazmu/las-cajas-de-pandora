import { sfx } from "../audio/sfx";
import { es } from "../content/es";
import { PRODUCERS, STAGES, type UpgradeDef } from "../game/defs";
import type { Game } from "../game/engine";
import { formatCps, formatCroquetas } from "../format/number";
import { CROQUETA_IMG, producerIcon } from "./assets";
import { asset, el } from "./dom";
import { openDetailCard, type DetailCard } from "./detail";
import { isCoarsePointer } from "./input";
import { attachTooltip, hideTooltip, type TooltipContent } from "./tooltip";

interface ProducerRow {
  id: string;
  stage: number;
  row: HTMLElement;
  owned: HTMLElement;
  cost: HTMLElement;
  cps: HTMLElement;
}

export interface StoreCallbacks {
  onExpansion(): void;
}

/** The right column: Expansion, Upgrade icons, and Producer rows grouped by Stage. */
export class Store {
  readonly root = el("aside", "store");
  private readonly expansion = el("section", "expansion");
  private readonly expansionName = el("div", "expansion-name");
  private readonly expansionCost = el("div", "expansion-cost");
  private readonly expansionBar = el("div", "expansion-bar-fill");
  private readonly expansionButton = el("button", "btn btn-primary expansion-button", es.ui.buy);
  private readonly upgrades = el("div", "upgrades");
  private readonly stageGroups = new Map<number, HTMLElement>();
  private readonly rows: ProducerRow[] = [];
  private upgradeSignature = "";
  /** The open Upgrade detail card (coarse pointers only). */
  private detail: DetailCard | null = null;

  constructor(
    private readonly game: Game,
    callbacks: StoreCallbacks,
  ) {
    this.root.append(el("h1", "store-title", es.ui.store));

    const bar = el("div", "expansion-bar");
    bar.append(this.expansionBar);
    this.expansion.append(
      el("div", "expansion-label", es.ui.expansionHeading),
      this.expansionName,
      this.expansionCost,
      bar,
      this.expansionButton,
    );
    this.expansionButton.addEventListener("click", () => {
      if (this.game.buyExpansion()) callbacks.onExpansion();
      else sfx.denied();
      this.update();
    });
    attachTooltip(this.expansion, () => {
      const exp = this.game.currentExpansion();
      const text = exp ? es.expansions[exp.id] : undefined;
      return {
        title: text?.name ?? "",
        lines: exp ? [es.ui.cost(formatCroquetas(exp.cost))] : [],
        flavor: text?.flavor ?? "",
      };
    });

    this.upgrades.setAttribute("aria-label", es.ui.upgradesHeading);
    this.root.append(this.expansion, this.upgrades);

    for (const stage of STAGES) {
      const group = el("section", "stage-group");
      group.append(el("h2", "stage-heading", es.stages[stage.id]?.name ?? ""));
      this.stageGroups.set(stage.number, group);
      this.root.append(group);
    }
    for (const def of PRODUCERS) this.addProducerRow(def.id, def.stage);
    this.update();
  }

  private addProducerRow(id: string, stage: number): void {
    const text = es.producers[id]!;
    const row = el("button", "producer");
    const icon = el("img", "producer-icon");
    icon.src = asset(producerIcon(id));
    icon.alt = "";
    const info = el("div", "producer-info");
    const cost = el("div", "producer-cost");
    const cps = el("div", "producer-cps");
    info.append(el("div", "producer-name", text.name), cost, cps);
    const owned = el("div", "producer-owned");
    row.append(icon, info, owned);
    row.addEventListener("click", () => {
      if (this.game.buyProducer(id)) sfx.buy();
      else sfx.denied();
      this.update();
    });
    attachTooltip(row, () => ({
      title: text.name,
      lines: [es.ui.cost(formatCroquetas(this.game.producerCost(id)))],
      flavor: text.flavor,
    }));
    this.stageGroups.get(stage)!.append(row);
    this.rows.push({ id, stage, row, owned, cost, cps });
  }

  private renderUpgrades(available: readonly UpgradeDef[]): void {
    this.upgrades.replaceChildren(
      ...available.map((u) => {
        const text = es.upgrades[u.id]!;
        const button = el("button", `upgrade tier-${u.tier}`);
        button.dataset.id = u.id;
        button.setAttribute("aria-label", text.name);
        const icon = el("img");
        icon.src = asset(
          u.effect.kind === "producerMultiplier" ? producerIcon(u.effect.producerId) : CROQUETA_IMG,
        );
        icon.alt = "";
        const badge = el(
          "span",
          "upgrade-badge",
          u.effect.kind === "clickCpsFraction" ? "+%" : `×${u.effect.multiplier}`,
        );
        button.append(icon, badge);
        const details = (): TooltipContent => ({
          title: text.name,
          lines: [effectText(u), es.ui.cost(formatCroquetas(u.cost))],
          flavor: text.flavor,
        });
        button.addEventListener("click", () => {
          // On touch there's no hover to read the Upgrade first, so a tap opens its card.
          if (isCoarsePointer()) this.openUpgradeCard(u, button, details);
          else this.buyUpgrade(u);
        });
        attachTooltip(button, details);
        return button;
      }),
    );
  }

  /** The one buy path for an Upgrade, from a desktop click or the card's Comprar. */
  private buyUpgrade(u: UpgradeDef): boolean {
    const bought = this.game.buyUpgrade(u.id);
    if (bought) {
      sfx.buy();
      hideTooltip();
    } else sfx.denied();
    this.update();
    return bought;
  }

  private openUpgradeCard(u: UpgradeDef, anchor: HTMLElement, content: () => TooltipContent): void {
    this.detail?.close();
    const card = openDetailCard({
      anchor,
      content,
      canBuy: () => this.game.state.croquetas >= u.cost,
      buy: () => this.buyUpgrade(u),
      onClose: () => {
        if (this.detail === card) this.detail = null;
      },
    });
    this.detail = card;
  }

  /** Refreshes counts, costs and affordability. Cheap enough to call several times a second. */
  update(): void {
    const { state } = this.game;
    const bank = state.croquetas;

    const exp = this.game.currentExpansion();
    this.expansion.hidden = !exp;
    if (exp) {
      this.expansionName.textContent = es.expansions[exp.id]?.name ?? "";
      this.expansionCost.textContent = es.ui.cost(formatCroquetas(exp.cost));
      this.expansionBar.style.width = `${Math.min(bank / exp.cost, 1) * 100}%`;
      this.expansionButton.setAttribute("aria-disabled", String(bank < exp.cost));
    }

    const available = this.game.availableUpgrades();
    const signature = available.map((u) => u.id).join(",");
    if (signature !== this.upgradeSignature) {
      this.upgradeSignature = signature;
      this.renderUpgrades(available);
    }
    for (const button of this.upgrades.querySelectorAll<HTMLElement>(".upgrade")) {
      const def = available.find((u) => u.id === button.dataset.id);
      button.classList.toggle("unaffordable", !def || bank < def.cost);
    }
    this.detail?.refresh();

    for (const [number, group] of this.stageGroups) group.hidden = number > state.stage;
    for (const r of this.rows) {
      if (r.stage > state.stage) continue;
      const cost = this.game.producerCost(r.id);
      const owned = state.producers[r.id] ?? 0;
      r.owned.textContent = owned > 0 ? es.ui.owned(owned) : "";
      r.cost.textContent = es.ui.cost(formatCroquetas(cost));
      const share = owned > 0 ? this.game.producerCps(r.id) : 0;
      r.cps.textContent = owned > 0 ? es.ui.producerCps(formatCps(share)) : "";
      r.row.classList.toggle("unaffordable", bank < cost);
      r.row.setAttribute("aria-disabled", String(bank < cost));
    }
  }
}

function effectText(u: UpgradeDef): string {
  switch (u.effect.kind) {
    case "producerMultiplier":
      return es.ui.upgradeEffectProducer(es.producers[u.effect.producerId]?.name ?? "");
    case "clickMultiplier":
      return es.ui.upgradeEffectClick;
    case "clickCpsFraction":
      return es.ui.upgradeEffectClickCps;
  }
}
