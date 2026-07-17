import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatBytes,
  getInitials,
  truncate,
  titleCase,
  formatDate,
} from "../format";

describe("formatCurrency", () => {
  // Intl separates a narrow symbol from the amount with U+00A0, not a space.
  const NPR = (amount) => `Rs\u00A0${amount}`;

  it("falls back to NPR, rendered as a narrow symbol not the bare code", () => {
    expect(formatCurrency(1234.5)).toBe(NPR("1,234.50"));
  });
  it("honours an explicit currency over the default", () => {
    expect(formatCurrency(1234.5, "INR")).toBe("₹1,234.50");
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });
  it("falls back when a record carries an empty currency", () => {
    expect(formatCurrency(1234.5, "")).toBe(NPR("1,234.50"));
    expect(formatCurrency(1234.5, null)).toBe(NPR("1,234.50"));
  });
  it("returns em dash for nullish values", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });
  it("handles zero", () => {
    expect(formatCurrency(0)).toBe(NPR("0.00"));
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
  it("returns em dash for invalid input", () => {
    expect(formatNumber(undefined)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats with one decimal by default", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
  });
});

describe("formatBytes", () => {
  it("scales units", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDate", () => {
  it("formats ISO strings", () => {
    expect(formatDate("2026-01-15T10:00:00.000Z")).toMatch(/Jan 15, 2026/);
  });
  it("returns em dash for empty input", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("getInitials", () => {
  it("takes first letters of first two words", () => {
    expect(getInitials("Jane Mary Doe")).toBe("JM");
  });
  it("handles single names and empty strings", () => {
    expect(getInitials("Plato")).toBe("P");
    expect(getInitials("")).toBe("");
  });
});

describe("truncate", () => {
  it("truncates long strings with ellipsis", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcde…");
  });
  it("leaves short strings alone", () => {
    expect(truncate("abc", 5)).toBe("abc");
  });
});

describe("titleCase", () => {
  it("converts snake_case and kebab-case", () => {
    expect(titleCase("closed_won")).toBe("Closed Won");
    expect(titleCase("in-progress")).toBe("In Progress");
  });
});
