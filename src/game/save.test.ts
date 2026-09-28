import { describe, expect, it, vi } from "vitest";
import { deserialize, migrate, serialize } from "./save";
import { createInitialState, type GameState } from "./state";

const fresh = () => createInitialState(42, () => 0);

function played(): GameState {
  return {
    ...fresh(),
    croquetas: 1234.5,
    totalCroquetas: 99_999,
    totalClicks: 321,
    stage: 2,
    producers: { ...fresh().producers, intern_puppy: 12, assembly_line: 3 },
    upgrades: ["click_1", "intern_puppy_1"],
    unlockedUpgrades: ["click_1", "intern_puppy_1", "intern_puppy_2"],
    frenzyUntil: 777,
    nextInversionistaAt: 888,
    lastSavedAt: 999,
    settings: { musicMuted: true, sfxMuted: false },
  };
}

describe("save", () => {
  it("round-trips a game in progress", () => {
    expect(deserialize(serialize(played()), fresh)).toEqual(played());
  });

  it("starts a new game when there is no save", () => {
    expect(deserialize(null, fresh)).toEqual(fresh());
  });

  it.each([
    ["not JSON", "{oops"],
    ["not an object", "42"],
    ["unknown version", JSON.stringify({ ...played(), version: 99 })],
    ["wrong field type", JSON.stringify({ ...played(), croquetas: "lots" })],
    ["missing field", JSON.stringify({ ...played(), stage: undefined })],
    ["stage out of range", JSON.stringify({ ...played(), stage: 7 })],
  ])("falls back to a new game on a corrupt save (%s) and warns", (_label, raw) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(deserialize(raw, fresh)).toEqual(fresh());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("fills in Producers that did not exist when the save was written", () => {
    const old = played();
    delete old.producers.mars_colony;
    expect(deserialize(serialize(old), fresh).producers.mars_colony).toBe(0);
  });

  it("migrating from version 1 is the identity", () => {
    const data = JSON.parse(serialize(played()));
    expect(migrate(data, 1)).toEqual(data);
  });
});
