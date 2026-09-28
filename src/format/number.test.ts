import { describe, expect, it } from "vitest";
import { formatCps, formatCroquetas } from "./number";

describe("formatCroquetas", () => {
  it("groups integers below one million with es-CO separators", () => {
    expect(formatCroquetas(123456)).toBe("123.456");
    expect(formatCroquetas(42.7)).toBe("42");
  });

  it("uses 3 significant digits and long-scale words from one million up", () => {
    expect(formatCroquetas(1_000_000)).toBe("1 millón");
    expect(formatCroquetas(1_500_000)).toBe("1,5 millones");
    expect(formatCroquetas(123_456_789)).toBe("123 millones");
    expect(formatCroquetas(2_000_000_000)).toBe("2 mil millones");
    expect(formatCroquetas(45_600_000_000)).toBe("45,6 mil millones");
    expect(formatCroquetas(1e12)).toBe("1 billón");
    expect(formatCroquetas(3.21e15)).toBe("3,21 mil billones");
    expect(formatCroquetas(1e18)).toBe("1 trillón");
    expect(formatCroquetas(7e21)).toBe("7 mil trillones");
    expect(formatCroquetas(2e24)).toBe("2 cuatrillones");
  });

  it("crosses the one-million boundary cleanly", () => {
    expect(formatCroquetas(999_999)).toBe("999.999");
    expect(formatCroquetas(999_999.9)).toBe("999.999");
    expect(formatCroquetas(1_000_000)).toBe("1 millón");
  });

  it("rolls over to the next scale when rounding reaches 1000", () => {
    expect(formatCroquetas(999_400_000)).toBe("999 millones");
    expect(formatCroquetas(999_500_000)).toBe("1 mil millones");
    expect(formatCroquetas(999_999_999_999)).toBe("1 billón");
  });

  it("uses the singular only when the displayed number is exactly 1", () => {
    expect(formatCroquetas(1_004_000)).toBe("1 millón");
    expect(formatCroquetas(1_010_000)).toBe("1,01 millones");
    expect(formatCroquetas(1e15)).toBe("1 mil billones");
  });
});

describe("formatCps", () => {
  it("shows one decimal below 1000", () => {
    expect(formatCps(1.5)).toBe("1,5");
    expect(formatCps(0.2)).toBe("0,2");
    expect(formatCps(12)).toBe("12");
    expect(formatCps(999.94)).toBe("999,9");
  });

  it("formats like croquetas from 1000 up", () => {
    expect(formatCps(1234.5)).toBe("1.234");
    expect(formatCps(2_500_000)).toBe("2,5 millones");
  });
});
