import { describe, expect, it } from "vitest";
import { EXPANSIONS, PRODUCERS, STAGES, UPGRADES } from "../game/defs";
import { es } from "./es";
import type { NamedFlavor } from "./types";

function expectNamedFlavor(entry: NamedFlavor | undefined, id: string) {
  expect(entry, `missing entry for ${id}`).toBeDefined();
  expect(entry!.name.trim(), `empty name for ${id}`).not.toBe("");
  expect(entry!.flavor.trim(), `empty flavor for ${id}`).not.toBe("");
}

describe("Spanish content covers every id in defs", () => {
  it("has a name and flavor for every Producer", () => {
    for (const p of PRODUCERS) expectNamedFlavor(es.producers[p.id], p.id);
    expect(Object.keys(es.producers).sort()).toEqual(PRODUCERS.map((p) => p.id).sort());
  });

  it("has a name and flavor for every Upgrade", () => {
    for (const u of UPGRADES) expectNamedFlavor(es.upgrades[u.id], u.id);
    expect(Object.keys(es.upgrades).sort()).toEqual(UPGRADES.map((u) => u.id).sort());
  });

  it("has a name and flavor for every Expansion", () => {
    for (const e of EXPANSIONS) expectNamedFlavor(es.expansions[e.id], e.id);
    expect(Object.keys(es.expansions).sort()).toEqual(EXPANSIONS.map((e) => e.id).sort());
  });

  it("has content for every Stage", () => {
    for (const s of STAGES) expect(es.stages[s.id], `missing stage ${s.id}`).toBeDefined();
    expect(Object.keys(es.stages).sort()).toEqual(STAGES.map((s) => s.id).sort());
  });
});

describe("Spanish content meets the spec §8 minimum counts", () => {
  it("has 12 Producers, 28 Upgrades and 2 Expansions", () => {
    expect(Object.keys(es.producers).length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(es.upgrades).length).toBeGreaterThanOrEqual(28);
    expect(Object.keys(es.expansions).length).toBeGreaterThanOrEqual(2);
  });

  it.each(STAGES.map((s) => s.id))("stage %s has 10+ headlines, 5+ quotes and a memo", (id) => {
    const stage = es.stages[id]!;
    expect(stage.name.trim()).not.toBe("");
    expect(stage.tickerHeadlines.length).toBeGreaterThanOrEqual(10);
    expect(stage.quotes.length).toBeGreaterThanOrEqual(5);
    expect(stage.memo.title.trim()).not.toBe("");
    expect(stage.memo.paragraphs.length).toBeGreaterThan(0);
    expect(stage.memo.dismiss.trim()).not.toBe("");
  });

  it("has 2+ headlines per Inversionista outcome", () => {
    expect(es.inversionista.frenzy.headlines.length).toBeGreaterThanOrEqual(2);
    expect(es.inversionista.lump.headlines.length).toBeGreaterThanOrEqual(2);
  });

  it("has 3+ offline Pandora lines", () => {
    expect(es.offlineLines.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps quotes short enough for a speech bubble", () => {
    for (const s of STAGES) {
      for (const q of es.stages[s.id]!.quotes) expect(q.length, q).toBeLessThanOrEqual(90);
    }
  });
});

describe("ui.duration", () => {
  it.each([
    [45_000, "45 s"],
    [0, "0 s"],
    [12 * 60_000, "12 min"],
    [12 * 60_000 + 30_000, "12 min"],
    [2 * 3_600_000 + 5 * 60_000, "2 h 5 min"],
    [3_600_000, "1 h"],
  ])("formats %d ms as %s", (ms, expected) => {
    expect(es.ui.duration(ms)).toBe(expected);
  });
});
