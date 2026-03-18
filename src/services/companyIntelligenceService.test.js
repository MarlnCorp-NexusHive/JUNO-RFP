/**
 * Tests for Company Intelligence API integration.
 * Uses mocked fetch so tests run without a real API key.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeSecFinancials,
  normalizeFmpFinancials,
  resolveSecCik,
} from "./companyIntelligenceService.js";

describe("Company Intelligence Service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  describe("resolveSecCik", () => {
    it("returns null for empty input", async () => {
      const cik = await resolveSecCik("");
      expect(cik).toBeNull();
    });

    it("returns null for whitespace-only input", async () => {
      const cik = await resolveSecCik("   ");
      expect(cik).toBeNull();
    });

    it("resolves CIK by ticker when SEC tickers list is available", async () => {
      const list = [
        { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
        { cik_str: 789019, ticker: "MSFT", title: "Microsoft Corporation" },
      ];
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => list });
      vi.resetModules();
      const { resolveSecCik: resolve } = await import("./companyIntelligenceService.js");
      const cik = await resolve("AAPL");
      expect(cik).toBe("0000320193");
    });

    it("resolves CIK by company name (partial match)", async () => {
      const list = [{ cik_str: 320193, ticker: "AAPL", title: "Apple Inc." }];
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => list });
      vi.resetModules();
      const { resolveSecCik: resolve } = await import("./companyIntelligenceService.js");
      const cik = await resolve("Apple");
      expect(cik).toBe("0000320193");
    });
  });

  describe("fetchCompanyIntelligence", () => {
    it("returns error when no data source works and no FMP key", async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false });
      vi.resetModules();
      const { fetchCompanyIntelligence: fetchCI } = await import("./companyIntelligenceService.js");
      const result = await fetchCI({ companyName: "UnknownXYZ123" });
      expect(result.financials).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.name).toBe("UnknownXYZ123");
    });

    it("returns SEC data when tickers and company facts are available", async () => {
      const tickers = [{ cik_str: 320193, ticker: "AAPL", title: "Apple Inc." }];
      const companyFacts = {
        entityName: "Apple Inc.",
        facts: {
          "us-gaap": {
            Revenue: { units: { USD: [{ end: "2024-09-30", val: 383285000000 }] } },
            NetIncomeLoss: { units: { USD: [{ end: "2024-09-30", val: 96995000000 }] } },
            Assets: { units: { USD: [{ end: "2024-09-30", val: 352755000000 }] } },
          },
        },
      };
      vi.mocked(fetch)
        .mockResolvedValueOnce({ ok: true, json: async () => tickers })
        .mockResolvedValueOnce({ ok: true, json: async () => companyFacts });
      vi.resetModules();
      const { fetchCompanyIntelligence: fetchCI } = await import("./companyIntelligenceService.js");
      const result = await fetchCI({ ticker: "AAPL" });
      expect(result.error).toBeNull();
      expect(result.source).toBe("SEC EDGAR");
      expect(result.name).toBe("Apple Inc.");
      expect(result.region).toBe("US");
      expect(result.financials.revenue[0].value).toBe(383285000000);
      expect(result.trends.revenue).toBeDefined();
      expect(result.customers).toBeTruthy();
    });
  });
});
