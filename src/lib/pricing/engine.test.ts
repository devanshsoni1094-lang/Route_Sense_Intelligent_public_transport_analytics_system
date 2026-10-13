import { describe, it, expect } from "vitest";
import {
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

describe("Pricing Engine Adapters", () => {
  describe("Suburban Rail Adapter", () => {
    it("calculates minimum base fare of ₹5 for short distance (<= 10 km)", () => {
      const result = calculateSuburbanRailFare(8, 1);
      expect(result.singleFare).toBe(5);
      expect(result.returnFare).toBe(10);
      expect(result.acSuburbanFare).toBe(35);
    });

    it("scales fare with distance bands and passenger count", () => {
      const result = calculateSuburbanRailFare(35, 2);
      expect(result.singleFare).toBe(30); // ₹15 * 2
      expect(result.returnFare).toBe(60);
    });
  });

  describe("Metro Rail Adapter", () => {
    it("calculates correct zone/stage fare for short trips", () => {
      const result = calculateMetroRailFare(2, 1);
      expect(result.farePerPerson).toBe(10);
      expect(result.totalFare).toBe(10);
    });

    it("caps at standard maximum slab of ₹60", () => {
      const result = calculateMetroRailFare(45, 1);
      expect(result.farePerPerson).toBe(60);
    });
  });

  describe("City Bus Adapter", () => {
    it("calculates ordinary and AC bus stage fares", () => {
      const result = calculateCityBusFare(8, 1);
      expect(result.ordinaryFare).toBe(10);
      expect(result.acFare).toBe(20);
    });
  });

  describe("Cab Adapter", () => {
    it("calculates hatchback, sedan, and SUV with surge during peak hours", () => {
      // 09:00 peak hour
      const peakTime = new Date("2026-10-13T09:00:00");
      const peakResult = calculateCabQuote(10, 25, peakTime);
      expect(peakResult.surgeMultiplier).toBe(1.25);
      expect(peakResult.hatchbackFare).toBeGreaterThan(150);
      expect(peakResult.sedanFare).toBeGreaterThan(peakResult.hatchbackFare);
      expect(peakResult.suvFare).toBeGreaterThan(peakResult.sedanFare);

      // 14:00 off-peak hour
      const offPeakTime = new Date("2026-10-13T14:00:00");
      const offPeakResult = calculateCabQuote(10, 25, offPeakTime);
      expect(offPeakResult.surgeMultiplier).toBe(1.0);
      expect(offPeakResult.hatchbackFare).toBeLessThan(peakResult.hatchbackFare);
    });
  });

  describe("Auto Rickshaw Adapter", () => {
    it("calculates base fare for first 1.5 km", () => {
      const daytime = new Date("2026-10-13T12:00:00");
      const res = calculateAutoFare(1.2, daytime);
      expect(res.meteredFare).toBe(23);
      expect(res.isNightSurcharge).toBe(false);
    });

    it("applies 25% night surcharge between 23:00 and 05:00", () => {
      const nightTime = new Date("2026-10-13T23:30:00");
      const dayTime = new Date("2026-10-13T12:00:00");
      const nightRes = calculateAutoFare(10, nightTime);
      const dayRes = calculateAutoFare(10, dayTime);
      expect(nightRes.isNightSurcharge).toBe(true);
      expect(nightRes.meteredFare).toBeGreaterThan(dayRes.meteredFare);
    });
  });

  describe("Bike Taxi Adapter", () => {
    it("calculates base + per km fare correctly", () => {
      const res = calculateBikeTaxiFare(10);
      // Base ₹25 + 10 * 8.5 = ₹110
      expect(res.fare).toBe(110);
    });
  });

  describe("Personal Vehicle Operating Cost Calculator", () => {
    it("computes fuel cost per formula: distance / efficiency * fuel_price", () => {
      const distance = 30;
      const fuelPrice = 100;
      const carEff = 15;
      const bikeEff = 50;

      const res = calculatePersonalVehicleOperatingCost(distance, fuelPrice, carEff, bikeEff);
      expect(res.carFuelCost).toBe(200); // 30 / 15 * 100 = 200
      expect(res.bikeFuelCost).toBe(60);  // 30 / 50 * 100 = 60
    });

    it("adds estimated NHAI tolls for long distance journeys > 35 km", () => {
      const res = calculatePersonalVehicleOperatingCost(120, 100, 15, 45);
      expect(res.estimatedTolls).toBeGreaterThan(0);
    });
  });

  describe("Intercity Indian Railways Adapter", () => {
    it("calculates all 5 classes (2S, SL, 3A, 2A, 1A) with telescopic rates", () => {
      const res = calculateIntercityRailFares(150, 1);
      expect(res.classes.length).toBe(5);
      expect(res.classes.map((c) => c.classCode)).toEqual(["2S", "SL", "3A", "2A", "1A"]);

      const class2S = res.classes.find((c) => c.classCode === "2S")!;
      const classSL = res.classes.find((c) => c.classCode === "SL")!;
      const class3A = res.classes.find((c) => c.classCode === "3A")!;
      const class1A = res.classes.find((c) => c.classCode === "1A")!;

      expect(class2S.totalFare).toBeLessThan(classSL.totalFare);
      expect(classSL.totalFare).toBeLessThan(class3A.totalFare);
      expect(class3A.totalFare).toBeLessThan(class1A.totalFare);
      expect(res.recommendedClass.classCode).toBe("SL");
      expect(class3A.gst).toBeGreaterThan(0); // 5% GST on AC classes
    });
  });

  describe("Intercity Bus Adapter", () => {
    it("calculates Ordinary, Express, AC Seater, and Volvo fares", () => {
      const res = calculateIntercityBusFares(100, 1);
      expect(res.ordinaryFare).toBeLessThan(res.expressFare);
      expect(res.expressFare).toBeLessThan(res.acSeaterFare);
      expect(res.acSeaterFare).toBeLessThan(res.acSleeperVolvoFare);
    });
  });

  describe("generateNormalizedJourneyOptions", () => {
    it("generates multi-modal options for urban commute (< 35 km)", () => {
      const options = generateNormalizedJourneyOptions({
        originName: "Dadar Railway Station",
        destName: "CSMT",
        originCity: "Mumbai",
        destCity: "Mumbai",
        distanceKm: 10.5
      });

      expect(options.length).toBeGreaterThanOrEqual(7);
      const modes = options.map((o) => o.transport_mode);
      expect(modes).toContain("TRAIN");
      expect(modes).toContain("METRO");
      expect(modes).toContain("BUS");
      expect(modes).toContain("CAB");
      expect(modes).toContain("AUTO");
      expect(modes).toContain("BIKE");
      expect(modes).toContain("CAR_PERSONAL");
    });

    it("generates intercity rail and bus options for journeys >= 35 km", () => {
      const options = generateNormalizedJourneyOptions({
        originName: "Mumbai",
        destName: "Pune",
        originCity: "Mumbai",
        destCity: "Pune",
        distanceKm: 150
      });

      const trainOptions = options.filter((o) => o.transport_mode === "TRAIN");
      const busOptions = options.filter((o) => o.transport_mode === "BUS");

      expect(trainOptions.length).toBeGreaterThanOrEqual(1);
      expect(busOptions.length).toBeGreaterThanOrEqual(1);

      const intercityTrain = trainOptions.find((t) => t.journey_id.includes("INTERCITY-TRAIN"));
      expect(intercityTrain).toBeDefined();
      expect(intercityTrain?.price_type).toBe("HISTORICAL_REFERENCE");
    });
  });
});
