import { INVERSIONISTA_MAX_DELAY_MS, INVERSIONISTA_MIN_DELAY_MS, PRODUCERS } from "./defs";

export type ProducerId = string;
export type UpgradeId = string;

export const SAVE_VERSION = 1;

export interface GameState {
  /** Save schema version. */
  version: number;
  /** Current bank. */
  croquetas: number;
  /** Lifetime produced. */
  totalCroquetas: number;
  totalClicks: number;
  /** 1-based index into STAGES. */
  stage: number;
  producers: Record<ProducerId, number>;
  upgrades: UpgradeId[];
  /** Upgrades whose unlock condition has held at least once; they stay visible until bought. */
  unlockedUpgrades: UpgradeId[];
  /** Epoch ms; a Ronda de Financiación is active until then. */
  frenzyUntil: number | null;
  /** Epoch ms when the next Inversionista appears. */
  nextInversionistaAt: number;
  /** Epoch ms up to which production has been accounted for; drives offline earnings. */
  lastSavedAt: number;
  settings: { musicMuted: boolean; sfxMuted: boolean };
}

export type Rng = () => number;
export type Clock = () => number;

export function inversionistaDelay(rng: Rng): number {
  return INVERSIONISTA_MIN_DELAY_MS + rng() * (INVERSIONISTA_MAX_DELAY_MS - INVERSIONISTA_MIN_DELAY_MS);
}

export function createInitialState(now: number, rng: Rng): GameState {
  return {
    version: SAVE_VERSION,
    croquetas: 0,
    totalCroquetas: 0,
    totalClicks: 0,
    stage: 1,
    producers: Object.fromEntries(PRODUCERS.map((p) => [p.id, 0])),
    upgrades: [],
    unlockedUpgrades: [],
    frenzyUntil: null,
    nextInversionistaAt: now + inversionistaDelay(rng),
    lastSavedAt: now,
    settings: { musicMuted: false, sfxMuted: false },
  };
}
