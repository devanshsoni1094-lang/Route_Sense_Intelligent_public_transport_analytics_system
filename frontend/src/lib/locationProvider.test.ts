import { describe, it, expect } from "vitest";
import { searchIndianLocations, resolveLocation } from "./locationProvider";

describe("Indian Location Search & Resolution Provider", () => {
  describe("searchIndianLocations", () => {
    it("returns empty results for empty or single-character query", async () => {
      const emptyRes = await searchIndianLocations("");
      expect(emptyRes.results).toEqual([]);

      const singleCharRes = await searchIndianLocations("M");
      expect(singleCharRes.results).toEqual([]);
    });

    it("returns verified results for Mumbai transit hubs", async () => {
      const res = await searchIndianLocations("Dadar");
      expect(res.results.length).toBeGreaterThan(0);
      const dadar = res.results.find((r) => r.displayName.toLowerCase().includes("dadar"));
      expect(dadar).toBeDefined();
      expect(dadar?.countryCode).toBe("IN");
    });

    it("returns verified results for Delhi transit hubs", async () => {
      const res = await searchIndianLocations("Rajiv Chowk");
      expect(res.results.length).toBeGreaterThan(0);
      const rajiv = res.results.find((r) => r.displayName.toLowerCase().includes("rajiv"));
      expect(rajiv).toBeDefined();
    });

    it("returns verified results for Bengaluru transit hubs", async () => {
      const res = await searchIndianLocations("Silk Board");
      expect(res.results.length).toBeGreaterThan(0);
      const silk = res.results.find((r) => r.displayName.toLowerCase().includes("silk board"));
      expect(silk).toBeDefined();
    });
  });

  describe("resolveLocation", () => {
    it("resolves location with canonical latitude and longitude", async () => {
      const res = await resolveLocation("Dadar Railway Station");
      expect(res.latitude).toBeGreaterThan(0);
      expect(res.longitude).toBeGreaterThan(0);
      expect(res.countryCode).toBe("IN");
      expect(res.displayName).toBeDefined();
    });

    it("resolves raw comma-separated coordinates string", async () => {
      const res = await resolveLocation("19.0178,72.8478");
      expect(res.latitude).toBeCloseTo(19.0178, 3);
      expect(res.longitude).toBeCloseTo(72.8478, 3);
    });
  });
});
