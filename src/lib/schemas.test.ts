import { describe, it, expect } from "vitest";
import {
  LocationAutocompleteQuerySchema,
  RoutePlannerQuerySchema,
  ResolvedLocationSchema,
  PriceTypeSchema
} from "./schemas";

describe("Route Sense Zod Schemas", () => {
  describe("LocationAutocompleteQuerySchema", () => {
    it("accepts valid queries with length >= 2", () => {
      const result = LocationAutocompleteQuerySchema.safeParse({ q: "Mumbai" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("Mumbai");
      }
    });

    it("rejects queries with length < 2", () => {
      const result = LocationAutocompleteQuerySchema.safeParse({ q: "M" });
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = LocationAutocompleteQuerySchema.safeParse({ q: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("RoutePlannerQuerySchema", () => {
    it("validates origin and destination with default values", () => {
      const result = RoutePlannerQuerySchema.safeParse({
        origin: "Dadar Railway Station",
        destination: "Chhatrapati Shivaji Maharaj Terminus"
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.passengers).toBe(1);
        expect(result.data.fuel_price).toBe(104.21);
        expect(result.data.sort_by).toBe("BALANCED");
      }
    });

    it("coerces numeric query strings correctly", () => {
      const result = RoutePlannerQuerySchema.safeParse({
        origin: "Dadar",
        destination: "CSMT",
        origin_lat: "19.0178",
        origin_lng: "72.8478",
        passengers: "3"
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.origin_lat).toBe(19.0178);
        expect(result.data.passengers).toBe(3);
      }
    });

    it("fails when origin or destination is missing", () => {
      const result = RoutePlannerQuerySchema.safeParse({
        origin: "",
        destination: "CSMT"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("PriceTypeSchema", () => {
    it("validates all 7 strict pricing classification types", () => {
      const validTypes = [
        "LIVE_PROVIDER_QUOTE",
        "OFFICIAL_TARIFF",
        "API_TRANSIT_FARE",
        "ESTIMATED_OPERATING_COST",
        "ESTIMATED_FARE",
        "HISTORICAL_REFERENCE",
        "PRICE_UNAVAILABLE"
      ];
      validTypes.forEach((type) => {
        const result = PriceTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid price classifications", () => {
      const result = PriceTypeSchema.safeParse("CHEAP_FARE");
      expect(result.success).toBe(false);
    });
  });

  describe("ResolvedLocationSchema", () => {
    it("validates a full ResolvedLocation object", () => {
      const validLoc = {
        provider: "google",
        providerPlaceId: "ChIJD82gDtvO5zsR0FuZOVBGikI",
        displayName: "Dadar",
        formattedAddress: "Dadar, Mumbai, Maharashtra, India",
        city: "Mumbai",
        state: "Maharashtra",
        countryCode: "IN",
        latitude: 19.0178,
        longitude: 72.8478,
        placeTypes: ["locality"],
        dataSource: "Google Places API (New)",
        retrievedAt: new Date().toISOString()
      };
      const result = ResolvedLocationSchema.safeParse(validLoc);
      expect(result.success).toBe(true);
    });
  });
});
