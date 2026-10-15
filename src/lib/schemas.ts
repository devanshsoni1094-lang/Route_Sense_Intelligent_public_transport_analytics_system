import { z } from "zod";

/**
 * Route Sense — Zod Validation Schemas
 * Strict runtime validation for API requests, responses, and provider models.
 */

export const PlaceCategorySchema = z.enum([
  "railway_station",
  "metro_station",
  "bus_terminal",
  "airport",
  "landmark",
  "locality",
  "city",
  "state",
  "address"
]);

export const PriceTypeSchema = z.enum([
  "LIVE_PROVIDER_QUOTE",
  "OFFICIAL_TARIFF",
  "API_TRANSIT_FARE",
  "ESTIMATED_OPERATING_COST",
  "ESTIMATED_FARE",
  "HISTORICAL_REFERENCE",
  "PRICE_UNAVAILABLE"
]);

export const FreshnessStatusSchema = z.enum([
  "LIVE",
  "VERIFIED_TARIFF",
  "STALE",
  "UNAVAILABLE"
]);

export const TransportModeSchema = z.enum([
  "TRAIN",
  "METRO",
  "BUS",
  "CAB",
  "AUTO",
  "BIKE",
  "CAR_PERSONAL",
  "MOTORCYCLE_PERSONAL",
  "WALK"
]);

export const ResolvedLocationSchema = z.object({
  provider: z.enum(["google", "indian_transit_db", "nominatim"]),
  providerPlaceId: z.string(),
  displayName: z.string(),
  formattedAddress: z.string(),
  locality: z.string().optional(),
  city: z.string(),
  state: z.string(),
  countryCode: z.literal("IN"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeTypes: z.array(PlaceCategorySchema),
  dataSource: z.string(),
  retrievedAt: z.string(),
  secondaryAddress: z.string().optional()
});

export const LocationAutocompleteQuerySchema = z.object({
  q: z.string().min(2, "Search query must contain at least 2 characters").max(120),
  session_token: z.string().optional()
});

export const LocationResolveQuerySchema = z.object({
  q: z.string().optional(),
  place_id: z.string().optional()
}).refine(data => data.q || data.place_id, {
  message: "Either query 'q' or 'place_id' must be provided"
});

export const RoutePlannerQuerySchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  origin_lat: z.coerce.number().optional().default(0),
  origin_lng: z.coerce.number().optional().default(0),
  dest_lat: z.coerce.number().optional().default(0),
  dest_lng: z.coerce.number().optional().default(0),
  passengers: z.coerce.number().int().min(1).max(20).default(1),
  fuel_price: z.coerce.number().positive().default(104.21),
  car_eff: z.coerce.number().positive().default(15.0),
  bike_eff: z.coerce.number().positive().default(45.0),
  sort_by: z.enum(["BALANCED", "CHEAPEST", "FASTEST", "SPEED", "COMFORT", "LEAST_WALKING"]).default("BALANCED")
});

export const JourneyStepSchema = z.object({
  step_number: z.number().int().positive(),
  instruction: z.string(),
  mode: z.string(),
  detail: z.string(),
  duration_min: z.number().nonnegative(),
  distance_km: z.number().nonnegative()
});

export const JourneyFareBreakdownSchema = z.object({
  base_fare_inr: z.number().nonnegative(),
  distance_fare_inr: z.number().nonnegative(),
  time_or_surge_fare_inr: z.number().nonnegative(),
  tolls_inr: z.number().nonnegative(),
  fuel_or_energy_cost_inr: z.number().nonnegative(),
  total_fare_inr: z.number().nonnegative(),
  currency: z.literal("INR")
});

export const NormalizedJourneyOptionSchema = z.object({
  journey_id: z.string(),
  transport_mode: TransportModeSchema,
  vehicle_category: z.string(),
  operator: z.string(),
  title: z.string(),
  origin: z.string(),
  destination: z.string(),
  route_distance_km: z.number().nonnegative(),
  total_duration_minutes: z.number().nonnegative(),
  in_vehicle_duration_minutes: z.number().nonnegative(),
  walking_duration_minutes: z.number().nonnegative(),
  waiting_duration_minutes: z.number().nonnegative(),
  transfers: z.number().int().nonnegative(),
  price_low_inr: z.number().nonnegative(),
  price_high_inr: z.number().nonnegative(),
  quoted_price_inr: z.number().nonnegative(),
  price_per_passenger_inr: z.number().nonnegative(),
  price_type: PriceTypeSchema,
  fare_breakdown: JourneyFareBreakdownSchema,
  availability_status: z.enum(["AVAILABLE", "HIGH_DEMAND", "LIMITED_SEATS", "UNAVAILABLE"]),
  departure_at: z.string(),
  arrival_at: z.string(),
  traffic_status: z.string(),
  source_name: z.string(),
  source_record_id: z.string(),
  observed_at: z.string(),
  retrieved_at: z.string(),
  effective_from: z.string(),
  freshness_status: FreshnessStatusSchema,
  reliability_score_pct: z.number().min(0).max(100),
  co2_emissions_g: z.number().nonnegative(),
  recommended: z.boolean(),
  booking_url: z.string().url().optional(),
  assumptions: z.array(z.string()),
  steps: z.array(JourneyStepSchema)
});

export type ValidatedResolvedLocation = z.infer<typeof ResolvedLocationSchema>;
export type ValidatedNormalizedJourneyOption = z.infer<typeof NormalizedJourneyOptionSchema>;
export type ValidatedRoutePlannerQuery = z.infer<typeof RoutePlannerQuerySchema>;
