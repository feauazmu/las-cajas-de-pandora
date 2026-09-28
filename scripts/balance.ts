// Headless pacing simulation: runs the real engine with a greedy player.
// The player clicks CLICKS_PER_SECOND times per second, buys an Expansion as
// soon as it is affordable, and otherwise buys the affordable item with the best
// cost / ΔCPS (click upgrades count as CLICKS_PER_SECOND × Δclick). A purely
// affordable-only greedy player never accumulates a bank, so the Expansion
// would only become affordable once every other item outprices it; instead,
// like a real player, it stops buying and saves once the Expansion is within
// SAVE_HORIZON_S of income. The Inversionista is disabled.

import { PRODUCERS, STAGES } from "../src/game/defs";
import { createGame, type Game } from "../src/game/engine";
import { createInitialState, type GameState } from "../src/game/state";

const CLICKS_PER_SECOND = 5;
const STEP_MS = 1_000;
const SAVE_HORIZON_S = 120;
const MAX_MS = 3 * 60 * 60 * 1000;
/** Keep playing this long after the last Stage to time its Producers. */
const AFTER_LAST_STAGE_MS = 30 * 60 * 1000;

type Purchase = { label: string; cost: number; buy: (g: Game) => boolean };

function rate(g: Game): number {
  return g.cps() + CLICKS_PER_SECOND * g.clickValue();
}

function gainOf(state: GameState, t: number, p: Purchase): number {
  const probe = createGame({ state: structuredClone(state), now: () => t, rng: () => 0 });
  const before = rate(probe);
  (probe.state as GameState).croquetas = Infinity;
  p.buy(probe);
  return rate(probe) - before;
}

function candidates(g: Game): Purchase[] {
  return [
    ...g.visibleProducers().map((p) => ({
      label: p.id,
      cost: g.producerCost(p.id),
      buy: (x: Game) => x.buyProducer(p.id),
    })),
    ...g.availableUpgrades().map((u) => ({
      label: u.id,
      cost: u.cost,
      buy: (x: Game) => x.buyUpgrade(u.id),
    })),
  ];
}

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

export interface SimResult {
  stageReachedAt: Record<number, number>;
  firstUnitAt: Record<string, number>;
}

export function simulate(): SimResult {
  const state = createInitialState(0, () => 0);
  state.nextInversionistaAt = Infinity;
  let t = 0;
  const game = createGame({ state, now: () => t, rng: () => 0 });
  const stageReachedAt: Record<number, number> = { 1: 0 };
  const firstUnitAt: Record<string, number> = {};

  while (t < MAX_MS && t < (stageReachedAt[STAGES.length] ?? Infinity) + AFTER_LAST_STAGE_MS) {
    t += STEP_MS;
    for (let i = 0; i < CLICKS_PER_SECOND; i++) game.click();
    game.tick(t);

    for (;;) {
      if (game.buyExpansion()) {
        stageReachedAt[state.stage] = t;
        continue;
      }
      const expansion = game.currentExpansion();
      if (expansion && (expansion.cost - state.croquetas) / rate(game) <= SAVE_HORIZON_S) break;
      const affordable = candidates(game).filter((c) => c.cost <= state.croquetas);
      let best: Purchase | undefined;
      let bestRatio = Infinity;
      for (const c of affordable) {
        const ratio = c.cost / gainOf(state, t, c);
        if (ratio < bestRatio) [best, bestRatio] = [c, ratio];
      }
      if (!best || !best.buy(game)) break;
      firstUnitAt[best.label] ??= t;
    }
  }
  return { stageReachedAt, firstUnitAt };
}

function report({ stageReachedAt, firstUnitAt }: SimResult): void {
  console.log("Stage reached at:");
  for (const s of STAGES) {
    const at = stageReachedAt[s.number];
    console.log(`  ${s.number} ${s.id.padEnd(14)} ${at === undefined ? "never" : fmt(at)}`);
  }
  console.log("First unit of each Producer:");
  for (const p of PRODUCERS) {
    const at = firstUnitAt[p.id];
    console.log(`  ${p.id.padEnd(20)} ${at === undefined ? "never" : fmt(at)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) report(simulate());
