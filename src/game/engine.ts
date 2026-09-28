import {
  BASE_CLICK_VALUE,
  COST_GROWTH,
  EXPANSIONS,
  FRENZY_DURATION_MS,
  FRENZY_MULTIPLIER,
  INVERSIONISTA_VISIBLE_MS,
  LUMP_BANK_FRACTION,
  LUMP_BONUS,
  LUMP_CPS_SECONDS,
  OFFLINE_CAP_MS,
  OFFLINE_EFFICIENCY,
  MAX_TICK_MS,
  PRODUCERS,
  UPGRADES,
  type ExpansionDef,
  type ProducerDef,
  type UnlockCondition,
  type UpgradeDef,
} from "./defs";
import { inversionistaDelay, type Clock, type GameState, type ProducerId, type Rng, type UpgradeId } from "./state";

export interface GameOptions {
  state: GameState;
  now: Clock;
  rng: Rng;
}

export interface InversionistaVisit {
  appearedAt: number;
  leavesAt: number;
}

export type InversionistaOutcome = { kind: "frenzy" } | { kind: "lump"; amount: number };

export interface OfflineReport {
  elapsedMs: number;
  gain: number;
}

export interface Game {
  readonly state: Readonly<GameState>;
  /** Clicks Pandora; returns the croquetas gained. */
  click(): number;
  /** Buys one unit; false if unaffordable or not yet available. */
  buyProducer(id: ProducerId): boolean;
  /** Buys an unlocked Upgrade; false if locked, owned or unaffordable. */
  buyUpgrade(id: UpgradeId): boolean;
  /** Buys the current Stage's Expansion and advances the Stage; false if none or unaffordable. */
  buyExpansion(): boolean;
  /** The Expansion out of the current Stage, or null on the last Stage. */
  currentExpansion(): ExpansionDef | null;
  /** Price of the next unit. */
  producerCost(id: ProducerId): number;
  /** Producers of the current and earlier Stages, in definition order. */
  visibleProducers(): readonly ProducerDef[];
  /** Unlocked, not-yet-bought Upgrades, in definition order. */
  availableUpgrades(): readonly UpgradeDef[];
  /** Croquetas one click yields right now. */
  clickValue(): number;
  /** Total croquetas per second right now, including an active frenzy. */
  cps(): number;
  /** Croquetas per second without the frenzy. */
  baseCps(): number;
  /** The Inversionista currently on screen, or null. */
  inversionista(): InversionistaVisit | null;
  /** Clicks the Inversionista if present; returns the reward granted, or null. */
  clickInversionista(): InversionistaOutcome | null;
  /** Milliseconds left in the Ronda de Financiación, 0 if none. */
  frenzyRemainingMs(): number;
  /** Advances production to `now`; gaps longer than MAX_TICK_MS are clamped. */
  tick(now: number): void;
  /**
   * Credits production for the gap since the last accounted time (load, or
   * returning to a hidden tab), capped and without the frenzy. An Inversionista
   * due during the gap is skipped and rescheduled.
   */
  applyOffline(now: number): OfflineReport;
}

function producerDef(id: ProducerId): ProducerDef {
  const def = PRODUCERS.find((p) => p.id === id);
  if (!def) throw new Error(`Unknown producer: ${id}`);
  return def;
}

export function createGame({ state, now, rng }: GameOptions): Game {
  function earn(amount: number): void {
    state.croquetas += amount;
    state.totalCroquetas += amount;
  }

  function spend(amount: number): boolean {
    if (state.croquetas < amount) return false;
    state.croquetas -= amount;
    return true;
  }

  function owned(id: ProducerId): number {
    return state.producers[id] ?? 0;
  }

  function producerCost(id: ProducerId): number {
    return Math.ceil(producerDef(id).baseCost * COST_GROWTH ** owned(id));
  }

  function isAvailable(def: ProducerDef): boolean {
    return state.stage >= def.stage;
  }

  function purchasedUpgrades(): UpgradeDef[] {
    return UPGRADES.filter((u) => state.upgrades.includes(u.id));
  }

  function producerCps(def: ProducerDef): number {
    let multiplier = 1;
    for (const u of purchasedUpgrades()) {
      if (u.effect.kind === "producerMultiplier" && u.effect.producerId === def.id) {
        multiplier *= u.effect.multiplier;
      }
    }
    return def.baseCps * owned(def.id) * multiplier;
  }

  function baseCps(): number {
    return PRODUCERS.reduce((sum, def) => sum + producerCps(def), 0);
  }

  function frenzyRemainingMs(): number {
    return state.frenzyUntil === null ? 0 : Math.max(state.frenzyUntil - now(), 0);
  }

  function frenzyFactor(): number {
    return frenzyRemainingMs() > 0 ? FRENZY_MULTIPLIER : 1;
  }

  function cps(): number {
    return baseCps() * frenzyFactor();
  }

  function inversionistaAt(t: number): InversionistaVisit | null {
    const appearedAt = state.nextInversionistaAt;
    const leavesAt = appearedAt + INVERSIONISTA_VISIBLE_MS;
    return t >= appearedAt && t < leavesAt ? { appearedAt, leavesAt } : null;
  }

  function scheduleInversionista(from: number): void {
    state.nextInversionistaAt = from + inversionistaDelay(rng);
  }

  function clickValue(): number {
    let multiplier = 1;
    let cpsFraction = 0;
    for (const u of purchasedUpgrades()) {
      if (u.effect.kind === "clickMultiplier") multiplier *= u.effect.multiplier;
      if (u.effect.kind === "clickCpsFraction") cpsFraction += u.effect.fraction;
    }
    return (BASE_CLICK_VALUE * multiplier + baseCps() * cpsFraction) * frenzyFactor();
  }

  function holds(condition: UnlockCondition): boolean {
    switch (condition.kind) {
      case "producerOwned":
        return owned(condition.producerId) >= condition.count;
      case "totalClicks":
        return state.totalClicks >= condition.count;
      case "stageAtLeast":
        return state.stage >= condition.stage;
    }
  }

  function refreshUnlocks(): void {
    for (const u of UPGRADES) {
      if (!state.unlockedUpgrades.includes(u.id) && u.unlock.every(holds)) {
        state.unlockedUpgrades.push(u.id);
      }
    }
  }

  function availableUpgrades(): UpgradeDef[] {
    return UPGRADES.filter(
      (u) => state.unlockedUpgrades.includes(u.id) && !state.upgrades.includes(u.id),
    );
  }

  function currentExpansion(): ExpansionDef | null {
    return EXPANSIONS.find((e) => e.fromStage === state.stage) ?? null;
  }

  refreshUnlocks();

  return {
    state,
    cps,
    baseCps,
    clickValue,
    frenzyRemainingMs,
    inversionista: () => inversionistaAt(now()),
    producerCost,
    currentExpansion,
    availableUpgrades,
    visibleProducers: () => PRODUCERS.filter(isAvailable),
    click() {
      const value = clickValue();
      state.totalClicks += 1;
      earn(value);
      refreshUnlocks();
      return value;
    },
    buyProducer(id) {
      if (!isAvailable(producerDef(id)) || !spend(producerCost(id))) return false;
      state.producers[id] = owned(id) + 1;
      refreshUnlocks();
      return true;
    },
    buyUpgrade(id) {
      const def = availableUpgrades().find((u) => u.id === id);
      if (!def || !spend(def.cost)) return false;
      state.upgrades.push(id);
      return true;
    },
    buyExpansion() {
      const expansion = currentExpansion();
      if (!expansion || !spend(expansion.cost)) return false;
      state.stage += 1;
      refreshUnlocks();
      return true;
    },
    clickInversionista() {
      const t = now();
      if (!inversionistaAt(t)) return null;
      let outcome: InversionistaOutcome;
      if (rng() < 0.5) {
        state.frenzyUntil = t + FRENZY_DURATION_MS;
        outcome = { kind: "frenzy" };
      } else {
        const amount =
          Math.min(state.croquetas * LUMP_BANK_FRACTION, cps() * LUMP_CPS_SECONDS) + LUMP_BONUS;
        earn(amount);
        outcome = { kind: "lump", amount };
      }
      scheduleInversionista(t);
      return outcome;
    },
    tick(t) {
      const dt = Math.min(Math.max(t - state.lastSavedAt, 0), MAX_TICK_MS);
      state.lastSavedAt = t;
      earn((cps() * dt) / 1000);
      if (t >= state.nextInversionistaAt + INVERSIONISTA_VISIBLE_MS) scheduleInversionista(t);
      refreshUnlocks();
    },
    applyOffline(t) {
      const elapsedMs = Math.min(Math.max(t - state.lastSavedAt, 0), OFFLINE_CAP_MS);
      const gain = (baseCps() * elapsedMs * OFFLINE_EFFICIENCY) / 1000;
      state.lastSavedAt = t;
      earn(gain);
      if (state.nextInversionistaAt <= t) scheduleInversionista(t);
      refreshUnlocks();
      return { elapsedMs, gain };
    },
  };
}
