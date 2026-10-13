import { describe, it, expect } from "vitest";
import {
  calculateBestBusFare,
  calculateMumbaiLocalTrainFare,
  calculateMumbaiMeteredFare,
  calculateRideHailingQuotes,
  calculatePersonalVehicleCosts,
  calculateIndianRailwaysExpressFare,
  calculateSuburbanRailFare,
  calculateMetroRailFare,
  calculateCityBusFare,
  calculateCabQuote,
  calculateAutoFare,
  calculateBikeTaxiFare,
  calculatePersonalVehicleOperatingCost,
  calculateIntercityRailFares,
  calculateIntercityBusFares,
  generateNormalizedJourneyOptions
} from "./engine";

describe("Route Sense — India Mobility Pricing Engine", () => {
  describe("1. Mumbai Public Transport (BEST Bus & Local Train)", () => {
    it("calculates BEST Bus Non-AC fare starting at ₹10 (0-5 km) and scaling to ₹60 at 50 km", () => {
      const shortTrip = calculateBestBusFare(4, 1);
      expect(shortTrip.nonAcFare).toBe(10);

      const fiftyKmTrip = calculateBestBusFare(50, 1);
      expect(fiftyKmTrip.nonAcFare).toBe(60);

      const intermediate = calculateBestBusFare(25, 1);
      expect(intermediate.nonAcFare).toBeGreaterThan(10);
      expect(intermediate.nonAcFare).toBeLessThan(60);
    });

    it("calculates BEST Bus AC fare starting at ₹12 (0-5 km) and scaling to ₹65 at 50 km", () => {
      const shortTrip = calculateBestBusFare(5, 1);
      expect(shortTrip.acFare).toBe(12);

      const fiftyKmTrip = calculateBestBusFare(50, 1);
      expect(fiftyKmTrip.acFare).toBe(65);
    });

    it("calculates Mumbai Local Train Second Class from ₹5 (0-3 km) to ₹30 beyond 31 km", () => {
      const shortDist = calculateMumbaiLocalTrainFare(2.5, 1);
      expect(shortDist.secondClassFare).toBe(5);

      const longDist = calculateMumbaiLocalTrainFare(48, 1);
      expect(longDist.secondClassFare).toBe(30);
    });

    it("calculates Mumbai Local Train First Class from ₹65 (0-3 km) to ₹235 beyond 31 km", () => {
      const shortDist = calculateMumbaiLocalTrainFare(2.5, 1);
      expect(shortDist.firstClassFare).toBe(65);

      const longDist = calculateMumbaiLocalTrainFare(40, 1);
      expect(longDist.firstClassFare).toBe(235);
    });
  });

  describe("2. Mumbai Metered Taxi & Auto (Kaali-Peeli - Sept 1, 2026 RTO)", () => {
    it("calculates Auto Rickshaw base ₹27 for first 1.5 km and ₹18.22/km thereafter", () => {
      const daytime = new Date("2026-10-13T14:00:00");
      const baseTrip = calculateMumbaiMeteredFare(1.2, daytime);
      expect(baseTrip.autoFare).toBe(27);

      // For 10 km: 27 + (10 - 1.5) * 18.22 = 27 + 8.5 * 18.22 = 27 + 154.87 = 181.87 ≈ 182
      const tenKmTrip = calculateMumbaiMeteredFare(10, daytime);
      expect(tenKmTrip.autoFare).toBe(182);
    });

    it("calculates Kaali-Peeli City Taxi base ₹33 for first 1.5 km and ₹21.90/km thereafter", () => {
      const daytime = new Date("2026-10-13T14:00:00");
      const baseTrip = calculateMumbaiMeteredFare(1.5, daytime);
      expect(baseTrip.taxiFare).toBe(33);

      // For 10 km: 33 + (10 - 1.5) * 21.90 = 33 + 8.5 * 21.90 = 33 + 186.15 = 219.15 ≈ 219
      const tenKmTrip = calculateMumbaiMeteredFare(10, daytime);
      expect(tenKmTrip.taxiFare).toBe(219);
    });

    it("applies 25% night surcharge between 12 AM (00:00) and 5 AM (05:00)", () => {
      const midnight = new Date("2026-10-13T02:00:00");
      const daytime = new Date("2026-10-13T14:00:00");

      const nightRes = calculateMumbaiMeteredFare(10, midnight);
      const dayRes = calculateMumbaiMeteredFare(10, daytime);

      expect(nightRes.isNightSurcharge).toBe(true);
      expect(dayRes.isNightSurcharge).toBe(false);
      expect(nightRes.autoFare).toBe(227);
      expect(nightRes.taxiFare).toBe(274);
    });

    it("applies waiting charges at 10% of per-km rate per minute of standstill traffic", () => {
      const daytime = new Date("2026-10-13T14:00:00");
      const withTraffic = calculateMumbaiMeteredFare(10, daytime, 10); // 10 mins standstill
      expect(withTraffic.waitingChargeAuto).toBeGreaterThan(0);
      expect(withTraffic.waitingChargeTaxi).toBeGreaterThan(0);
    });
  });

  describe("3. Ride-Hailing Apps (Uber, Ola, Rapido 2026 Benchmarks)", () => {
    it("matches Bike Taxi benchmarks for 10 km (Rapido ~₹50, Ola Bike ~₹61, Uber Moto ~₹78)", () => {
      const quotes = calculateRideHailingQuotes(10, new Date());
      expect(quotes.rapidoBike).toBe(50);
      expect(quotes.olaBike).toBe(61);
      expect(quotes.uberMoto).toBe(78);
    });

    it("matches Auto Rickshaw benchmarks for 10 km (Rapido ~₹87, Ola ~₹104, Uber ~₹121)", () => {
      const quotes = calculateRideHailingQuotes(10, new Date());
      expect(quotes.rapidoAuto).toBe(87);
      expect(quotes.olaAuto).toBe(104);
      expect(quotes.uberAuto).toBe(121);
      expect(quotes.rapidoAutoLite).toBeGreaterThanOrEqual(12 * 10);
      expect(quotes.rapidoAutoLite).toBeLessThanOrEqual(15 * 10);
    });

    it("matches Economy Cab benchmarks for 10 km (Ola Mini ~₹173, UberGo ~₹184)", () => {
      const quotes = calculateRideHailingQuotes(10, new Date());
      expect(quotes.olaMini).toBe(173);
      expect(quotes.uberGo).toBe(184);
    });

    it("calculates Premium Sedans (₹23.80 - ₹27.80/km) and SUVs (₹34.20 - ₹35.30/km)", () => {
      const quotes = calculateRideHailingQuotes(20, new Date());
      expect(quotes.sedanPremier).toBeGreaterThan(quotes.uberGo);
      expect(quotes.suvXl).toBeGreaterThan(quotes.sedanPremier);
    });
  });

  describe("4. Personal Vehicle Running Costs (Fuel: Petrol ₹102/L, Diesel ₹92/L, CNG ₹88/kg)", () => {
    it("computes bike commuter at ₹1.46/km and scooter at ₹2.27/km", () => {
      const costs = calculatePersonalVehicleCosts(10);
      expect(costs.petrolBikeCommuter).toBe(14.6);
      expect(costs.petrolScooterAuto).toBe(22.7);
    });

    it("computes CNG cars between ₹2.75 and ₹3.14/km", () => {
      const costs = calculatePersonalVehicleCosts(10);
      expect(costs.cngCarLow).toBe(27.5);
      expect(costs.cngCarHigh).toBe(31.4);
    });

    it("computes diesel cars between ₹3.83 and ₹4.18/km", () => {
      const costs = calculatePersonalVehicleCosts(10);
      expect(costs.dieselCarLow).toBe(38.3);
      expect(costs.dieselCarHigh).toBe(41.8);
    });

    it("computes petrol cars from ₹4.64/km up to ₹8.50/km for SUVs", () => {
      const costs = calculatePersonalVehicleCosts(10);
      expect(costs.petrolCarHatchback).toBe(46.4);
      expect(costs.petrolCarSuv).toBe(85.0);
    });
  });

  describe("5. Indian Railways (Express Passenger Trains)", () => {
    it("calculates Unreserved UTS fares (₹0.30/km suburban, ₹0.45/km non-suburban)", () => {
      const express = calculateIndianRailwaysExpressFare(100, 1);
      expect(express.unreservedUtsSuburban).toBe(30);
      expect(express.unreservedUtsNonSuburban).toBe(45);
    });

    it("enforces minimum base fares: 2S ₹10, SL ₹35, 3A ₹105, 2A ₹180, 1A ₹360", () => {
      const shortTrip = calculateIndianRailwaysExpressFare(15, 1);
      const class2S = shortTrip.classes.find((c) => c.classCode === "2S")!;
      const classSL = shortTrip.classes.find((c) => c.classCode === "SL")!;
      const class3A = shortTrip.classes.find((c) => c.classCode === "3A")!;
      const class2A = shortTrip.classes.find((c) => c.classCode === "2A")!;
      const class1A = shortTrip.classes.find((c) => c.classCode === "1A")!;

      expect(class2S.baseFare).toBeGreaterThanOrEqual(10);
      expect(classSL.baseFare).toBeGreaterThanOrEqual(35);
      expect(class3A.baseFare).toBeGreaterThanOrEqual(105);
      expect(class2A.baseFare).toBeGreaterThanOrEqual(180);
      expect(class1A.baseFare).toBeGreaterThanOrEqual(360);
      expect(class3A.gst).toBeGreaterThan(0); // 5% GST
    });
  });

  describe("6. generateNormalizedJourneyOptions", () => {
    it("generates comprehensive transit passes covering all user-requested options", () => {
      const options = generateNormalizedJourneyOptions({
        originName: "Dadar Railway Station",
        destName: "CSMT",
        originCity: "Mumbai",
        destCity: "Mumbai",
        distanceKm: 10
      });

      expect(options.length).toBeGreaterThanOrEqual(20);

      // Verify specific modes requested by user
      const titles = options.map((o) => o.title.toLowerCase());
      expect(titles.some((t) => t.includes("mumbai local") && t.includes("2nd class"))).toBe(true);
      expect(titles.some((t) => t.includes("mumbai local") && t.includes("1st class"))).toBe(true);
      expect(titles.some((t) => t.includes("best bus") && t.includes("non-ac"))).toBe(true);
      expect(titles.some((t) => t.includes("best bus") && t.includes("ac"))).toBe(true);
      expect(titles.some((t) => t.includes("kaali-peeli"))).toBe(true);
      expect(titles.some((t) => t.includes("metered auto"))).toBe(true);
      expect(titles.some((t) => t.includes("ubergo"))).toBe(true);
      expect(titles.some((t) => t.includes("ola mini"))).toBe(true);
      expect(titles.some((t) => t.includes("rapido auto"))).toBe(true);
      expect(titles.some((t) => t.includes("rapido bike"))).toBe(true);
      expect(titles.some((t) => t.includes("uber moto"))).toBe(true);
      expect(titles.some((t) => t.includes("commuter 70 km/l"))).toBe(true);
      expect(titles.some((t) => t.includes("scooter") && t.includes("45 km/l"))).toBe(true);
      expect(titles.some((t) => t.includes("cng"))).toBe(true);
      expect(titles.some((t) => t.includes("diesel"))).toBe(true);
      expect(titles.some((t) => t.includes("uts"))).toBe(true);
      expect(titles.some((t) => t.includes("irctc express"))).toBe(true);
    });
  });
});
