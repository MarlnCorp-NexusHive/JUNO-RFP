/**
 * Tests for Company Intelligence (bundled samples + normalizers).
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("./api.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchCompanyIntelligenceRemote: vi.fn(() => Promise.reject(new Error("remote disabled in tests"))),
  };
});

import {
  normalizeSecFinancials,
  normalizeFmpFinancials,
  fetchCompanyIntelligence,
} from "./companyIntelligenceService.js";

describe("Company Intelligence Service", () => {
  describe("normalizeSecFinancials", () => {
    it("returns empty arrays when facts is null", () => {
      const out = normalizeSecFinancials(null);
      expect(out.revenue).toEqual([]);
      expect(out.netIncome).toEqual([]);
      expect(out.assets).toEqual([]);
      expect(out.source).toBe("SEC EDGAR");
      expect(out.region).toBe("US");
    });

    it("returns empty when facts.facts is missing", () => {
      const out = normalizeSecFinancials({});
      expect(out.revenue).toEqual([]);
      expect(out.netIncome).toEqual([]);
    });

    it("extracts revenue, netIncome, assets from us-gaap USD units", () => {
      const facts = {
        facts: {
          "us-gaap": {
            Revenue: {
              units: {
                USD: [
                  { end: "2024-09-30", val: 1000000000, form: "10-K" },
                  { end: "2023-09-30", val: 900000000, form: "10-K" },
                ],
              },
            },
            NetIncomeLoss: {
              units: { USD: [{ end: "2024-09-30", val: 200000000, form: "10-K" }] },
            },
            Assets: {
              units: { USD: [{ end: "2024-09-30", val: 5000000000, form: "10-K" }] },
            },
          },
        },
      };
      const out = normalizeSecFinancials(facts);
      expect(out.revenue).toHaveLength(2);
      expect(out.revenue[0]).toEqual({ period: "2024-09-30", value: 1000000000, form: "10-K" });
      expect(out.netIncome[0].value).toBe(200000000);
      expect(out.assets[0].value).toBe(5000000000);
    });
  });

  describe("normalizeFmpFinancials", () => {
    it("returns empty revenue/netIncome when incomeStatements is empty", () => {
      const out = normalizeFmpFinancials({ companyName: "Test" }, []);
      expect(out.revenue).toEqual([]);
      expect(out.netIncome).toEqual([]);
      expect(out.source).toBe("Financial Modeling Prep");
    });

    it("maps income statements to revenue and netIncome trends", () => {
      const profile = { companyName: "Apple Inc.", country: "US" };
      const income = [
        { date: "2024-09-28", calendarYear: "2024", revenue: 383285000000, netIncome: 96995000000 },
        { date: "2023-09-30", calendarYear: "2023", revenue: 383285000000, netIncome: 96995000000 },
      ];
      const out = normalizeFmpFinancials(profile, income);
      expect(out.revenue).toHaveLength(2);
      expect(out.revenue[0].period).toBe("2024-09-28");
      expect(out.revenue[0].value).toBe(383285000000);
      expect(out.netIncome[0].value).toBe(96995000000);
      expect(out.companyName).toBe("Apple Inc.");
      expect(out.region).toBe("US");
    });
  });

  describe("fetchCompanyIntelligence", () => {
    it("returns error when no sample matches and remote lookup is unavailable", async () => {
      const result = await fetchCompanyIntelligence({ companyName: "UnknownXYZ123" });
      expect(result.financials).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.name).toBe("UnknownXYZ123");
      expect(result.error).toMatch(/live lookup failed|No sample data/);
    });

    it("returns bundled sample data for a known ticker", async () => {
      const result = await fetchCompanyIntelligence({ ticker: "AAPL", companyName: "AAPL" });
      expect(result.error).toBeNull();
      expect(result.financials).toBeTruthy();
      expect(result.trends?.revenue?.length).toBeGreaterThan(0);
      expect(result.name).toBeTruthy();
      expect(result.source).toMatch(/bundled snapshot|Offline sample/);
      expect(result.remote).toBe(false);
    });

    it("resolves by company name substring", async () => {
      const result = await fetchCompanyIntelligence({ companyName: "Microsoft" });
      expect(result.error).toBeNull();
      expect(result.ticker).toBe("MSFT");
    });
  });
});
