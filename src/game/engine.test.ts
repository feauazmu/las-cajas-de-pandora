import { describe, expect, it } from "vitest";
import { createGame, type Game } from "./engine";
import { createInitialState, type GameState } from "./state";

const T0 = 1_000_000;

function setup(overrides: Partial<GameState> = {}, rngValues: number[] = [0.5]) {
  const clock = { t: T0 };
  let i = 0;
  const rng = () => rngValues[i++ % rngValues.length]!;
  const state = { ...createInitialState(T0, () => 0), ...overrides };
  const game: Game = createGame({ state, now: () => clock.t, rng });
  return { game, clock, state };
}

describe("clicking Pandora", () => {
  it("yields 1 croqueta per click on a new game and counts clicks", () => {
    const { game } = setup();
    expect(game.click()).toBe(1);
    game.click();
    expect(game.state.croquetas).toBe(2);
    expect(game.state.totalCroquetas).toBe(2);
    expect(game.state.totalClicks).toBe(2);
  });
});

describe("buying Producers", () => {
  it("costs ceil(baseCost × 1.15^owned)", () => {
    const { game } = setup({ croquetas: 1_000 });
    expect(game.producerCost("intern_puppy")).toBe(15);
    expect(game.buyProducer("intern_puppy")).toBe(true);
    expect(game.producerCost("intern_puppy")).toBe(18); // 17.25
    game.buyProducer("intern_puppy");
    expect(game.producerCost("intern_puppy")).toBe(20); // 19.8375
    expect(game.state.producers.intern_puppy).toBe(2);
    expect(game.state.croquetas).toBe(1_000 - 15 - 18);
  });

  it("refuses when the bank is short", () => {
    const { game } = setup({ croquetas: 14 });
    expect(game.buyProducer("intern_puppy")).toBe(false);
    expect(game.state.croquetas).toBe(14);
    expect(game.state.producers.intern_puppy).toBe(0);
  });
});

describe("Stage gating", () => {
  it("hides and refuses a later Stage's Producers until that Stage", () => {
    const { game } = setup({ croquetas: 1e9 });
    expect(game.visibleProducers().map((p) => p.id)).toEqual([
      "intern_puppy",
      "neighbor_grandma",
      "industrial_blender",
      "food_truck",
    ]);
    expect(game.buyProducer("assembly_line")).toBe(false);
    expect(game.state.croquetas).toBe(1e9);
  });

  it("keeps earlier Stages' Producers visible after moving on", () => {
    const { game } = setup({ croquetas: 1e9, stage: 2 });
    expect(game.visibleProducers()).toHaveLength(8);
    expect(game.buyProducer("assembly_line")).toBe(true);
    expect(game.buyProducer("intern_puppy")).toBe(true);
  });
});

describe("production", () => {
  it("sums baseCps × owned across Producers", () => {
    const { game } = setup({ producers: { intern_puppy: 10, neighbor_grandma: 3 } });
    expect(game.cps()).toBeCloseTo(2 + 3);
  });

  it("tick adds cps × elapsed time", () => {
    const { game, clock } = setup({ producers: { neighbor_grandma: 4 } });
    clock.t += 500;
    game.tick(clock.t);
    expect(game.state.croquetas).toBeCloseTo(2);
    expect(game.state.totalCroquetas).toBeCloseTo(2);
  });

  it("clamps a single tick to one second", () => {
    const { game, clock } = setup({ producers: { neighbor_grandma: 4 } });
    clock.t += 30_000;
    game.tick(clock.t);
    expect(game.state.croquetas).toBeCloseTo(4);
  });
});

describe("Upgrades", () => {
  it("unlocks a Producer's tier 1 at 1 owned and tier 2 at 10 owned", () => {
    const { game } = setup({ croquetas: 1e6 });
    expect(game.availableUpgrades()).toEqual([]);
    game.buyProducer("intern_puppy");
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["intern_puppy_1"]);
    for (let i = 0; i < 9; i++) game.buyProducer("intern_puppy");
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["intern_puppy_1", "intern_puppy_2"]);
  });

  it("prices tiers at baseCost × 10 and × 100 and removes them once bought", () => {
    const { game } = setup({ croquetas: 10_000, producers: { neighbor_grandma: 10 } });
    game.tick(T0);
    const [t1, t2] = game.availableUpgrades();
    expect([t1?.cost, t2?.cost]).toEqual([1_000, 10_000]);
    expect(game.buyUpgrade("neighbor_grandma_1")).toBe(true);
    expect(game.state.croquetas).toBe(9_000);
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["neighbor_grandma_2"]);
    expect(game.buyUpgrade("neighbor_grandma_1")).toBe(false);
    expect(game.buyUpgrade("neighbor_grandma_2")).toBe(false); // 9 000 < 10 000
  });

  it("refuses an Upgrade that is not unlocked yet", () => {
    const { game } = setup({ croquetas: 1e6 });
    expect(game.buyUpgrade("intern_puppy_1")).toBe(false);
    expect(game.state.croquetas).toBe(1e6);
  });

  it("keeps an unlocked Upgrade visible even if its condition no longer holds", () => {
    const { game } = setup({ croquetas: 1e6 });
    game.buyProducer("food_truck");
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["food_truck_1"]);
    game.state.producers.food_truck = 0;
    game.tick(T0);
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["food_truck_1"]);
  });

  it("each producer upgrade doubles that Producer's output", () => {
    const { game } = setup({
      croquetas: 1e6,
      producers: { neighbor_grandma: 10, intern_puppy: 5 },
    });
    game.tick(T0);
    game.buyUpgrade("neighbor_grandma_1");
    game.buyUpgrade("neighbor_grandma_2");
    expect(game.cps()).toBeCloseTo(10 * 1 * 4 + 5 * 0.2);
  });
});

describe("click Upgrades", () => {
  it("click_1 unlocks at 50 clicks and doubles the click", () => {
    const { game } = setup({ croquetas: 100 });
    for (let i = 0; i < 49; i++) game.click();
    expect(game.availableUpgrades().map((u) => u.id)).toEqual([]);
    game.click();
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["click_1"]);
    expect(game.buyUpgrade("click_1")).toBe(true);
    expect(game.clickValue()).toBe(2);
    expect(game.click()).toBe(2);
  });

  it("stacks click_1..3 multiplicatively (×8)", () => {
    const { game } = setup({
      croquetas: 1e9,
      stage: 2,
      totalClicks: 500,
      unlockedUpgrades: [],
    });
    game.tick(T0);
    for (const id of ["click_1", "click_2", "click_3"]) expect(game.buyUpgrade(id)).toBe(true);
    expect(game.clickValue()).toBe(8);
  });

  it("click_3 needs Stage 2; click_4 needs Stage 2 and 1 000 clicks", () => {
    const { game, state } = setup({ totalClicks: 999, unlockedUpgrades: [] });
    game.tick(T0);
    expect(game.availableUpgrades().map((u) => u.id)).toEqual(["click_1", "click_2"]);
    state.stage = 2;
    game.tick(T0);
    expect(game.availableUpgrades().map((u) => u.id)).toContain("click_3");
    expect(game.availableUpgrades().map((u) => u.id)).not.toContain("click_4");
    game.click();
    expect(game.availableUpgrades().map((u) => u.id)).toContain("click_4");
  });

  it("click_4 adds 1% of CPS to each click", () => {
    const { game } = setup({
      croquetas: 1e9,
      stage: 2,
      totalClicks: 1_000,
      producers: { assembly_line: 10 }, // 1 200 cps
      unlockedUpgrades: [],
    });
    game.tick(T0);
    game.buyUpgrade("click_4");
    expect(game.clickValue()).toBeCloseTo(1 + 12);
  });
});

describe("Expansions", () => {
  it("offers the current Stage's Expansion", () => {
    const { game } = setup();
    expect(game.currentExpansion()).toMatchObject({ id: "buy_factory", cost: 50_000 });
  });

  it("refuses when unaffordable", () => {
    const { game } = setup({ croquetas: 49_999 });
    expect(game.buyExpansion()).toBe(false);
    expect(game.state.stage).toBe(1);
    expect(game.state.croquetas).toBe(49_999);
  });

  it("deducts the cost and advances the Stage", () => {
    const { game } = setup({ croquetas: 60_000 });
    expect(game.buyExpansion()).toBe(true);
    expect(game.state.stage).toBe(2);
    expect(game.state.croquetas).toBe(10_000);
    expect(game.currentExpansion()?.id).toBe("go_public");
    expect(game.visibleProducers()).toHaveLength(8);
  });

  it("has no Expansion past the last Stage", () => {
    const { game } = setup({ croquetas: 1e12, stage: 3 });
    expect(game.currentExpansion()).toBeNull();
    expect(game.buyExpansion()).toBe(false);
    expect(game.state.stage).toBe(3);
    expect(game.state.croquetas).toBe(1e12);
  });
});

describe("Inversionista", () => {
  const MIN = 60_000;

  it("first appears 2–5 minutes after a new game, driven by rng", () => {
    expect(createInitialState(T0, () => 0).nextInversionistaAt).toBe(T0 + 2 * MIN);
    expect(createInitialState(T0, () => 1).nextInversionistaAt).toBe(T0 + 5 * MIN);
    expect(createInitialState(T0, () => 0.5).nextInversionistaAt).toBe(T0 + 3.5 * MIN);
  });

  it("is clickable for 12 s, then leaves and is rescheduled 2–5 minutes later", () => {
    const { game, clock } = setup({}, [1]);
    const at = game.state.nextInversionistaAt;
    clock.t = at - 1;
    game.tick(clock.t);
    expect(game.inversionista()).toBeNull();
    clock.t = at;
    game.tick(clock.t);
    expect(game.inversionista()).toEqual({ appearedAt: at, leavesAt: at + 12_000 });
    clock.t = at + 11_999;
    game.tick(clock.t);
    expect(game.inversionista()).not.toBeNull();
    clock.t = at + 12_000;
    game.tick(clock.t);
    expect(game.inversionista()).toBeNull();
    expect(game.state.nextInversionistaAt).toBe(at + 12_000 + 5 * MIN);
  });

  it("does nothing when clicked while absent", () => {
    const { game } = setup({ croquetas: 100 });
    expect(game.clickInversionista()).toBeNull();
    expect(game.state.croquetas).toBe(100);
  });

  it("Ronda de Financiación: ×7 production and clicks for 30 s", () => {
    const { game, clock } = setup({ producers: { neighbor_grandma: 2 } }, [0.2, 0]);
    clock.t = game.state.nextInversionistaAt + 1_000;
    expect(game.clickInversionista()).toEqual({ kind: "frenzy" });
    expect(game.state.frenzyUntil).toBe(clock.t + 30_000);
    expect(game.inversionista()).toBeNull();
    expect(game.state.nextInversionistaAt).toBe(clock.t + 2 * MIN);
    expect(game.cps()).toBeCloseTo(14);
    expect(game.clickValue()).toBe(7);
    expect(game.frenzyRemainingMs()).toBe(30_000);
    clock.t += 30_000;
    expect(game.cps()).toBeCloseTo(2);
    expect(game.clickValue()).toBe(1);
    expect(game.frenzyRemainingMs()).toBe(0);
  });

  it("applies the frenzy to click_4's CPS share only once", () => {
    const { game } = setup({
      stage: 2,
      producers: { assembly_line: 10 }, // 1 200 cps
      upgrades: ["click_4"],
      frenzyUntil: T0 + 10_000,
    });
    expect(game.clickValue()).toBeCloseTo((1 + 12) * 7);
  });

  it("a second frenzy resets the timer instead of stacking", () => {
    const { game, clock } = setup(
      { producers: { neighbor_grandma: 1 }, nextInversionistaAt: T0, frenzyUntil: T0 + 20_000 },
      [0.2, 0],
    );
    clock.t = T0 + 5_000;
    game.clickInversionista();
    expect(game.state.frenzyUntil).toBe(T0 + 35_000);
    expect(game.cps()).toBeCloseTo(7);
  });

  it("Cheque Gordo: gains min(bank × 0.15, cps × 900) + 13", () => {
    // Bank-limited: 0.15 × 1 000 = 150 < 1 × 900.
    const a = setup({ croquetas: 1_000, producers: { neighbor_grandma: 1 } }, [0.7, 0]);
    a.clock.t = a.game.state.nextInversionistaAt;
    expect(a.game.clickInversionista()).toEqual({ kind: "lump", amount: 163 });
    expect(a.game.state.croquetas).toBe(1_163);
    // CPS-limited: 1 × 900 = 900 < 0.15 × 100 000.
    const b = setup({ croquetas: 100_000, producers: { neighbor_grandma: 1 } }, [0.7, 0]);
    b.clock.t = b.game.state.nextInversionistaAt;
    expect(b.game.clickInversionista()).toEqual({ kind: "lump", amount: 913 });
    expect(b.game.state.frenzyUntil).toBeNull();
  });
});

describe("offline earnings", () => {
  const HOUR = 3_600_000;

  it("credits baseCps × elapsed since the last accounted time", () => {
    const { game } = setup({ producers: { neighbor_grandma: 2 } });
    expect(game.applyOffline(T0 + 10 * 60_000)).toEqual({ elapsedMs: 10 * 60_000, gain: 1_200 });
    expect(game.state.croquetas).toBe(1_200);
    expect(game.state.lastSavedAt).toBe(T0 + 10 * 60_000);
  });

  it("caps elapsed time at 8 h", () => {
    const { game } = setup({ producers: { neighbor_grandma: 1 } });
    expect(game.applyOffline(T0 + 30 * HOUR)).toEqual({ elapsedMs: 8 * HOUR, gain: 8 * 3_600 });
  });

  it("never applies the frenzy", () => {
    const { game } = setup({ producers: { neighbor_grandma: 1 }, frenzyUntil: T0 + 10 * HOUR });
    expect(game.applyOffline(T0 + 100_000).gain).toBe(100);
  });

  it("gains nothing when the clock went backwards", () => {
    const { game } = setup({ producers: { neighbor_grandma: 1 } });
    expect(game.applyOffline(T0 - 50_000)).toEqual({ elapsedMs: 0, gain: 0 });
    expect(game.state.croquetas).toBe(0);
  });

  it("never produces an Inversionista from offline time", () => {
    const { game, clock } = setup({ nextInversionistaAt: T0 + 60_000 }, [0]);
    clock.t = T0 + 65_000;
    game.applyOffline(clock.t);
    expect(game.inversionista()).toBeNull();
    expect(game.state.nextInversionistaAt).toBe(clock.t + 120_000);
  });
});
