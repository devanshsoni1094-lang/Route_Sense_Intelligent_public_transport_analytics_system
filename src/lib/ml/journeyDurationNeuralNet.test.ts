import { describe, it, expect } from "vitest";
import { predictJourneyDurationWithNeuralNet } from "./journeyDurationNeuralNet";

describe("Route Sense — Deep Learning Neural Network Duration Predictor", () => {
  it("predicts duration accurately for a 10 km Mumbai Local Train journey", () => {
    const res = predictJourneyDurationWithNeuralNet({
      distanceKm: 10,
      transportMode: "TRAIN",
      departureHour: 9, // Peak morning
      dayOfWeek: 2 // Tuesday
    });

    expect(res.predictedDurationMin).toBeGreaterThanOrEqual(15);
    expect(res.predictedDurationMin).toBeLessThanOrEqual(25);
    expect(res.confidencePct).toBeGreaterThan(85);
    expect(res.networkDetails.modelType).toContain("Deep Learning");
    expect(res.networkDetails.architecture).toContain("Dense(16, ReLU)");
    expect(res.lowerBoundMin).toBeLessThanOrEqual(res.predictedDurationMin);
    expect(res.upperBoundMin).toBeGreaterThanOrEqual(res.predictedDurationMin);
  });

  it("predicts higher duration during peak hours for road transport (Cab) vs off-peak", () => {
    const peakTrip = predictJourneyDurationWithNeuralNet({
      distanceKm: 15,
      transportMode: "CAB",
      departureHour: 9, // 9 AM peak
      dayOfWeek: 1 // Monday
    });

    const offPeakTrip = predictJourneyDurationWithNeuralNet({
      distanceKm: 15,
      transportMode: "CAB",
      departureHour: 2, // 2 AM night
      dayOfWeek: 1
    });

    expect(peakTrip.predictedDurationMin).toBeGreaterThan(offPeakTrip.predictedDurationMin);
    expect(peakTrip.trafficDelayFactor).toBeGreaterThan(offPeakTrip.trafficDelayFactor);
  });

  it("predicts faster transit for Metro than BEST Bus over same 12 km distance", () => {
    const metro = predictJourneyDurationWithNeuralNet({
      distanceKm: 12,
      transportMode: "METRO",
      departureHour: 10
    });

    const bus = predictJourneyDurationWithNeuralNet({
      distanceKm: 12,
      transportMode: "BUS",
      departureHour: 10
    });

    expect(metro.predictedDurationMin).toBeLessThan(bus.predictedDurationMin);
  });

  it("handles extreme distances safely without throwing errors", () => {
    const shortTrip = predictJourneyDurationWithNeuralNet({
      distanceKm: 0.2,
      transportMode: "AUTO"
    });
    expect(shortTrip.predictedDurationMin).toBeGreaterThanOrEqual(5);

    const longTrip = predictJourneyDurationWithNeuralNet({
      distanceKm: 85,
      transportMode: "TRAIN"
    });
    expect(longTrip.predictedDurationMin).toBeGreaterThan(60);
  });
});
