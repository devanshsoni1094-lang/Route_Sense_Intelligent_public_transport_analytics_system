import { describe, it, expect } from "vitest";
import {
  decodePolyline,
  mapGoogleTypesToCategory,
  sanitizeLogMessage,
  getGoogleMapsServerKey
} from "./googleMapsService";

describe("Google Maps Service Utilities", () => {
  describe("sanitizeLogMessage", () => {
    it("redacts API keys passed in URL parameters", () => {
      const message = "Request failed for https://maps.googleapis.com/maps/api/place?key=AIzaSyFakeKeyForTesting123456789&input=Dadar";
      const sanitized = sanitizeLogMessage(message);
      expect(sanitized).not.toContain("AIzaSyFakeKeyForTesting123456789");
      expect(sanitized).toContain("[REDACTED");
    });

    it("redacts API keys in X-Goog-Api-Key header logs", () => {
      const message = "Headers sent: X-Goog-Api-Key: AIzaSyFakeKeyForTesting123456789, Content-Type: application/json";
      const sanitized = sanitizeLogMessage(message);
      expect(sanitized).not.toContain("AIzaSyFakeKeyForTesting123456789");
      expect(sanitized).toContain("[REDACTED");
    });

    it("handles empty or safe strings without error", () => {
      expect(sanitizeLogMessage("")).toBe("");
      expect(sanitizeLogMessage("Normal error occurred")).toBe("Normal error occurred");
    });
  });

  describe("decodePolyline", () => {
    it("decodes a valid Google encoded polyline string to [lat, lng] coordinates", () => {
      // Standard encoded polyline representing a path in Mumbai
      const encoded = "glasBwas{L_KaHqBoAO@wIaGZe@nDbCtB|A\\f@zBxApFxD|HjFlGpE`ElC|KlGdB~@vEvCtA~@hF`D|Aj@dDx@xAZpA`@t@\\hCpAfClBrAxAt@h@v@Xx@TlEp@dDh@lE|@rCj@tGhAzAR|BDbCDhARx@VdChAt@Vl@L`BL|BFtLh@n@Nv@\\hB`Af@Rz@Jr@AxF]pACdBBhH^xMx@tEd@bNvCvB^`KvAjEl@vCV|AEfAGtGu@l@AXBdDr@p@Xv@h@^b@l@f@t@Xd@JhD@~JE~@AfCQpBEvCHlDd@vDr@rD`@vGRrEJdCDfDb@t@@jEEf@EzBe@tBK^MPQv@{@ZOt@OpCSzBQpBKxAU`@Q\\]t@}@`@]d@Y~@_@bJ{Ah@I|CMzAUtA_@bBm@x@_@j@Qt@GzDV~B\\pGjBjA`@n@@zOu@dBMfFS";
      const points = decodePolyline(encoded);
      expect(points.length).toBeGreaterThan(10);
      expect(points[0][0]).toBeCloseTo(19.01, 1);
      expect(points[0][1]).toBeCloseTo(72.84, 1);
    });

    it("returns empty array for empty string", () => {
      expect(decodePolyline("")).toEqual([]);
    });
  });

  describe("mapGoogleTypesToCategory", () => {
    it("maps transit train stations to railway_station", () => {
      expect(mapGoogleTypesToCategory(["train_station", "transit_station"])).toBe("railway_station");
    });

    it("maps metro stations to metro_station", () => {
      expect(mapGoogleTypesToCategory(["subway_station", "transit_station"])).toBe("metro_station");
    });

    it("maps bus stops to bus_terminal", () => {
      expect(mapGoogleTypesToCategory(["bus_station", "transit_station"])).toBe("bus_terminal");
    });

    it("maps airports to airport", () => {
      expect(mapGoogleTypesToCategory(["airport", "point_of_interest"])).toBe("airport");
    });

    it("maps landmarks to landmark", () => {
      expect(mapGoogleTypesToCategory(["tourist_attraction", "point_of_interest"])).toBe("landmark");
    });

    it("maps localities to locality", () => {
      expect(mapGoogleTypesToCategory(["sublocality_level_1", "political"])).toBe("locality");
    });
  });
});
