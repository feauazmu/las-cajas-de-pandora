import { PRODUCERS, STAGES, UPGRADES } from "./defs";
import { SAVE_VERSION, type GameState } from "./state";

export const SAVE_KEY = "lcdp.save.v1";

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Brings raw save data written by schema `fromVersion` up to SAVE_VERSION.
 * Add one step per future version bump.
 */
export function migrate(data: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
  if (fromVersion === SAVE_VERSION) return data;
  throw new Error(`Unsupported save version: ${fromVersion}`);
}

/** Parses a save, or returns `fallback()` for a missing, unknown or corrupt one. */
export function deserialize(raw: string | null, fallback: () => GameState): GameState {
  if (raw === null) return fallback();
  try {
    return validate(parseAndMigrate(raw));
  } catch (error) {
    console.warn("Discarding unreadable save; starting a new game.", error);
    return fallback();
  }
}

function parseAndMigrate(raw: string): Record<string, unknown> {
  const data: unknown = JSON.parse(raw);
  if (!isRecord(data)) throw new Error("Save is not an object");
  if (typeof data.version !== "number") throw new Error("Save has no version");
  return migrate(data, data.version);
}

function validate(data: Record<string, unknown>): GameState {
  const settings = data.settings;
  const producers = data.producers;
  if (!isRecord(settings) || !isRecord(producers)) throw new Error("Malformed save");
  const stage = num(data.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > STAGES.length) {
    throw new Error(`Stage out of range: ${stage}`);
  }
  const knownUpgrades = (ids: unknown) => strings(ids).filter((id) => UPGRADES.some((u) => u.id === id));
  return {
    version: SAVE_VERSION,
    croquetas: num(data.croquetas),
    totalCroquetas: num(data.totalCroquetas),
    totalClicks: num(data.totalClicks),
    stage,
    producers: Object.fromEntries(
      PRODUCERS.map((p) => [p.id, producers[p.id] === undefined ? 0 : num(producers[p.id])]),
    ),
    upgrades: knownUpgrades(data.upgrades),
    unlockedUpgrades: knownUpgrades(data.unlockedUpgrades),
    frenzyUntil: data.frenzyUntil === null ? null : num(data.frenzyUntil),
    nextInversionistaAt: num(data.nextInversionistaAt),
    lastSavedAt: num(data.lastSavedAt),
    settings: { musicMuted: bool(settings.musicMuted), sfxMuted: bool(settings.sfxMuted) },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Not a number: ${String(value)}`);
  return value;
}

function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error(`Not a boolean: ${String(value)}`);
  return value;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error("Not a string list");
  }
  return value;
}
