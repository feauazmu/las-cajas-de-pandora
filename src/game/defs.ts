// Game data: Stages, Producers, Upgrades, Expansions and balance constants.
// Adding a Stage means adding entries here (plus strings in content/es.ts and
// assets); the engine has no per-Stage branches.
//
// Balance (npm run balance): TBD

export interface StageDef {
  /** 1-based Stage number; `state.stage` indexes this list. */
  readonly number: number;
  readonly id: string;
}

export interface ProducerDef {
  readonly id: string;
  readonly stage: number;
  readonly baseCost: number;
  readonly baseCps: number;
}

export interface ExpansionDef {
  readonly id: string;
  /** Buying it moves the company from this Stage to the next one. */
  readonly fromStage: number;
  readonly cost: number;
}

/** All conditions must hold for an Upgrade to unlock. */
export type UnlockCondition =
  | { readonly kind: "producerOwned"; readonly producerId: string; readonly count: number }
  | { readonly kind: "totalClicks"; readonly count: number }
  | { readonly kind: "stageAtLeast"; readonly stage: number };

export type UpgradeEffect =
  | { readonly kind: "producerMultiplier"; readonly producerId: string; readonly multiplier: number }
  | { readonly kind: "clickMultiplier"; readonly multiplier: number }
  | { readonly kind: "clickCpsFraction"; readonly fraction: number };

export interface UpgradeDef {
  readonly id: string;
  readonly cost: number;
  /** 1 or 2; drives the icon frame. */
  readonly tier: number;
  readonly effect: UpgradeEffect;
  readonly unlock: readonly UnlockCondition[];
}

export const STAGES: readonly StageDef[] = [
  { number: 1, id: "kitchen" },
  { number: 2, id: "factory" },
  { number: 3, id: "multinational" },
];

export const PRODUCERS: readonly ProducerDef[] = [
  { id: "intern_puppy", stage: 1, baseCost: 15, baseCps: 0.2 },
  { id: "neighbor_grandma", stage: 1, baseCost: 100, baseCps: 1 },
  { id: "industrial_blender", stage: 1, baseCost: 600, baseCps: 5 },
  { id: "food_truck", stage: 1, baseCost: 4_000, baseCps: 25 },
  { id: "assembly_line", stage: 2, baseCost: 30_000, baseCps: 120 },
  { id: "accountant_cats", stage: 2, baseCost: 200_000, baseCps: 600 },
  { id: "delivery_truck", stage: 2, baseCost: 1_500_000, baseCps: 3_000 },
  { id: "tofu_lab", stage: 2, baseCost: 10_000_000, baseCps: 15_000 },
  { id: "dog_influencer", stage: 3, baseCost: 100_000_000, baseCps: 80_000 },
  { id: "congress_lobby", stage: 3, baseCost: 800_000_000, baseCps: 450_000 },
  { id: "ad_satellite", stage: 3, baseCost: 6_000_000_000, baseCps: 2_500_000 },
  { id: "mars_colony", stage: 3, baseCost: 50_000_000_000, baseCps: 14_000_000 },
];

export const EXPANSIONS: readonly ExpansionDef[] = [
  { id: "buy_factory", fromStage: 1, cost: 50_000 },
  { id: "go_public", fromStage: 2, cost: 150_000_000 },
];

/** Producer upgrade tiers: each is ×2 to its Producer. */
const PRODUCER_UPGRADE_TIERS = [
  { tier: 1, ownedToUnlock: 1, costFactor: 10 },
  { tier: 2, ownedToUnlock: 10, costFactor: 100 },
] as const;

const PRODUCER_UPGRADES: readonly UpgradeDef[] = PRODUCERS.flatMap((p) =>
  PRODUCER_UPGRADE_TIERS.map(
    (t): UpgradeDef => ({
      id: `${p.id}_${t.tier}`,
      cost: p.baseCost * t.costFactor,
      tier: t.tier,
      effect: { kind: "producerMultiplier", producerId: p.id, multiplier: 2 },
      unlock: [{ kind: "producerOwned", producerId: p.id, count: t.ownedToUnlock }],
    }),
  ),
);

const CLICK_UPGRADES: readonly UpgradeDef[] = [
  {
    id: "click_1",
    cost: 100,
    tier: 1,
    effect: { kind: "clickMultiplier", multiplier: 2 },
    unlock: [{ kind: "totalClicks", count: 50 }],
  },
  {
    id: "click_2",
    cost: 5_000,
    tier: 1,
    effect: { kind: "clickMultiplier", multiplier: 2 },
    unlock: [{ kind: "totalClicks", count: 500 }],
  },
  {
    id: "click_3",
    cost: 500_000,
    tier: 2,
    effect: { kind: "clickMultiplier", multiplier: 2 },
    unlock: [{ kind: "stageAtLeast", stage: 2 }],
  },
  {
    id: "click_4",
    cost: 20_000_000,
    tier: 2,
    effect: { kind: "clickCpsFraction", fraction: 0.01 },
    unlock: [
      { kind: "stageAtLeast", stage: 2 },
      { kind: "totalClicks", count: 1_000 },
    ],
  },
];

export const UPGRADES: readonly UpgradeDef[] = [...PRODUCER_UPGRADES, ...CLICK_UPGRADES];

export const COST_GROWTH = 1.15;
export const BASE_CLICK_VALUE = 1;

export const FRENZY_MULTIPLIER = 7;
export const FRENZY_DURATION_MS = 30_000;
export const INVERSIONISTA_MIN_DELAY_MS = 2 * 60_000;
export const INVERSIONISTA_MAX_DELAY_MS = 5 * 60_000;
export const INVERSIONISTA_VISIBLE_MS = 12_000;
export const LUMP_BANK_FRACTION = 0.15;
export const LUMP_CPS_SECONDS = 900;
export const LUMP_BONUS = 13;

export const MAX_TICK_MS = 1_000;
export const OFFLINE_EFFICIENCY = 1;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
