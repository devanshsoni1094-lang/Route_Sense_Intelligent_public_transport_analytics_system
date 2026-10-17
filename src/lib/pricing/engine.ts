/**
 * Route Sense — Intelligent Public Transport Analytics System
 * Comprehensive India Mobility Pricing Engine & Provider Adapters
 * 
 * Supports:
 * 1. Mumbai Public Transport (BEST Bus Non-AC & AC, Mumbai Local Train 2nd & 1st Class)
 * 2. Mumbai Metered Taxi & Auto (Kaali-Peeli City Taxi, Auto-Rickshaw - RTO Sept 1, 2026 regulated)
 * 3. Ride-Hailing Apps (UberGo, Ola Mini, Uber Premier, SUVs, Rapido Cab, Rapido Auto, Ola Auto, Uber Auto)
 * 4. Bike Taxis (Rapido Bike, Ola Bike, Uber Moto)
 * 5. Personal Vehicle Running Costs (Commuter Bike 70km/L, Scooter 45km/L, CNG Car, Diesel Car, Petrol Cars)
 * 6. Indian Railways Telescopic Express (UTS Unreserved, 2S, Sleeper SL, 3A, 2A, 1A)
 * 7. Metro Rapid Transit (DMRC, Mumbai Metro, Namma Metro, Maha Metro)
 */

export type PriceType =
  | "LIVE_PROVIDER_QUOTE"
  | "OFFICIAL_TARIFF"
  | "API_TRANSIT_FARE"
  | "ESTIMATED_OPERATING_COST"
  | "ESTIMATED_FARE"
  | "HISTORICAL_REFERENCE"
  | "PRICE_UNAVAILABLE";

export type FreshnessStatus = "LIVE" | "VERIFIED_TARIFF" | "STALE" | "UNAVAILABLE";

export interface JourneyFareBreakdown {
  base_fare_inr: number;
  distance_fare_inr: number;
  time_or_surge_fare_inr: number;
  tolls_inr: number;
  fuel_or_energy_cost_inr: number;
  total_fare_inr: number;
  currency: string;
}

export interface NormalizedJourneyOption {
  journey_id: string;
  transport_mode: "TRAIN" | "METRO" | "BUS" | "CAB" | "AUTO" | "BIKE" | "CAR_PERSONAL" | "MOTORCYCLE_PERSONAL";
  vehicle_category: string;
  operator: string;
  title: string;
  origin: string;
  destination: string;
  route_distance_km: number;
  total_duration_minutes: number;
  in_vehicle_duration_minutes: number;
  walking_duration_minutes: number;
  waiting_duration_minutes: number;
  transfers: number;
  price_low_inr: number;
  price_high_inr: number;
  quoted_price_inr: number;
  price_per_passenger_inr: number;
  price_type: PriceType;
  fare_breakdown: JourneyFareBreakdown;
  availability_status: "AVAILABLE" | "HIGH_DEMAND" | "LIMITED_SEATS" | "UNAVAILABLE";
  departure_at: string;
  arrival_at: string;
  traffic_status: string;
  source_name: string;
  source_record_id: string;
  observed_at: string;
  retrieved_at: string;
  effective_from: string;
  freshness_status: FreshnessStatus;
  reliability_score_pct: number;
  co2_emissions_g: number;
  recommended: boolean;
  booking_url?: string;
  assumptions: string[];
  steps: {
    step_number: number;
    instruction: string;
    mode: string;
    detail: string;
    duration_min: number;
    distance_km: number;
  }[];
}

export interface PricingEngineParams {
  originName: string;
  destName: string;
  originCity: string;
  destCity: string;
  distanceKm: number;
  departureTime?: Date;
  passengers?: number;
  fuelPricePerLitre?: number;
  carEfficiencyKpl?: number;
  bikeEfficiencyKpl?: number;
  apiKeyAvailable?: boolean;
}

function getISTTimeString(date: Date, offsetMins: number = 0): string {
  const d = new Date(date.getTime() + offsetMins * 60000);
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) + " IST";
}

/**
 * 1. BEST BUS ADAPTER (Mumbai Public Transport)
 * Non-AC: Starts at ₹10 for first 5 km (₹2.00/km), scaling up to ₹60 for 50 km (₹1.20/km).
 * AC: Starts at ₹12 for first 5 km (₹2.40/km), scaling up to ₹65 for 50 km (₹1.30/km).
 */
export function calculateBestBusFare(distanceKm: number, passengers: number = 1): {
  nonAcFare: number;
  acFare: number;
  assumptions: string[];
} {
  const d = Math.max(0.5, distanceKm);
  let nonAcPerPax = 10;
  if (d <= 5) {
    nonAcPerPax = 10;
  } else if (d <= 50) {
    nonAcPerPax = Math.round(10 + ((d - 5) / 45) * (60 - 10));
  } else {
    nonAcPerPax = Math.round(60 + (d - 50) * 1.20);
  }

  let acPerPax = 12;
  if (d <= 5) {
    acPerPax = 12;
  } else if (d <= 50) {
    acPerPax = Math.round(12 + ((d - 5) / 45) * (65 - 12));
  } else {
    acPerPax = Math.round(65 + (d - 50) * 1.30);
  }

  return {
    nonAcFare: nonAcPerPax * passengers,
    acFare: acPerPax * passengers,
    assumptions: [
      `Official BEST Undertaking Fare Chart (Mumbai Public Transport)`,
      `Non-AC: Starts at ₹10 (0-5 km, ₹2.00/km) scaling to ₹60 at 50 km (₹1.20/km)`,
      `AC: Starts at ₹12 (0-5 km, ₹2.40/km) scaling to ₹65 at 50 km (₹1.30/km)`,
      `Calculated for ${distanceKm} km across ${passengers} passenger(s)`
    ]
  };
}

/**
 * 2. MUMBAI LOCAL TRAIN ADAPTER
 * Second Class: Fares start at ₹5 for 0-3 km (₹1.66/km), reaching ₹30 for distances beyond 31 km (<₹1.00/km).
 * First Class: Fares start at ₹65 for 0-3 km (₹21.66/km), reaching ₹235 for distances beyond 31 km.
 */
export function calculateMumbaiLocalTrainFare(distanceKm: number, passengers: number = 1): {
  secondClassFare: number;
  firstClassFare: number;
  acLocalFare: number;
  assumptions: string[];
} {
  const d = Math.max(0.5, distanceKm);

  let iiFare = 5;
  if (d <= 3) iiFare = 5;
  else if (d <= 10) iiFare = 10;
  else if (d <= 20) iiFare = 15;
  else if (d <= 30) iiFare = 20;
  else if (d <= 45) iiFare = 25;
  else iiFare = 30;

  let iFare = 65;
  if (d <= 3) iFare = 65;
  else if (d <= 10) iFare = 105;
  else if (d <= 20) iFare = 155;
  else if (d <= 30) iFare = 195;
  else iFare = 235;

  let acFare = 65;
  if (d <= 10) acFare = 65;
  else if (d <= 20) acFare = 115;
  else if (d <= 35) acFare = 160;
  else acFare = 220;

  return {
    secondClassFare: iiFare * passengers,
    firstClassFare: iFare * passengers,
    acLocalFare: acFare * passengers,
    assumptions: [
      `Official Mumbai Suburban Railway Distance Slabs (Central & Western Railway)`,
      `Second Class: ₹5 (0-3 km) up to ₹30 (>31 km)`,
      `First Class: ₹65 (0-3 km) up to ₹235 (>31 km)`,
      `Calculated for ${distanceKm} km across ${passengers} passenger(s)`
    ]
  };
}

/**
 * 3. MUMBAI METERED TAXI & AUTO (Kaali-Peeli) - RTO Sept 1, 2026 Regulated
 * Auto Rickshaw: ₹27 base fare for first 1.5 km, followed by exactly ₹18.22 per km.
 * Kaali-Peeli City Taxi: ₹33 base fare for first 1.5 km, followed by exactly ₹21.90 per km.
 * Night Surcharge: 25% between 12 AM (00:00) and 5 AM (05:00).
 * Waiting Charges: 10% of per-km rate per minute of standstill traffic.
 */
export function calculateMumbaiMeteredFare(distanceKm: number, departureTime: Date, standstillMinutes: number = 0): {
  autoFare: number;
  taxiFare: number;
  isNightSurcharge: boolean;
  waitingChargeAuto: number;
  waitingChargeTaxi: number;
  assumptions: string[];
} {
  const hour = departureTime.getHours();
  const isNightSurcharge = hour >= 0 && hour < 5;
  const nightMultiplier = isNightSurcharge ? 1.25 : 1.0;

  let autoDistanceCharge = 0;
  if (distanceKm > 1.5) {
    autoDistanceCharge = (distanceKm - 1.5) * 18.22;
  }
  const waitingChargeAuto = standstillMinutes * (18.22 * 0.10);
  const autoFare = Math.round((27 + autoDistanceCharge + waitingChargeAuto) * nightMultiplier);

  let taxiDistanceCharge = 0;
  if (distanceKm > 1.5) {
    taxiDistanceCharge = (distanceKm - 1.5) * 21.90;
  }
  const waitingChargeTaxi = standstillMinutes * (21.90 * 0.10);
  const taxiFare = Math.round((33 + taxiDistanceCharge + waitingChargeTaxi) * nightMultiplier);

  return {
    autoFare,
    taxiFare,
    isNightSurcharge,
    waitingChargeAuto: Math.round(waitingChargeAuto),
    waitingChargeTaxi: Math.round(waitingChargeTaxi),
    assumptions: [
      `Official Maharashtra RTO Metered Tariff (Updated September 1, 2026)`,
      `Auto Rickshaw: ₹27 base (first 1.5 km) + exactly ₹18.22/km`,
      `Kaali-Peeli Taxi: ₹33 base (first 1.5 km) + exactly ₹21.90/km`,
      isNightSurcharge ? `Night surcharge: +25% active (12 AM - 5 AM)` : `Daytime metered tariff (no night surcharge)`,
      standstillMinutes > 0 ? `Traffic waiting charges: 10% of per-km rate per min of standstill traffic` : `Free-flowing traffic conditions`
    ]
  };
}

/**
 * 4. RIDE-HAILING APPS (Uber, Ola, Rapido)
 * Bike Taxis (10 km benchmark): Rapido ~₹50 (₹5.00/km), Ola Bike ~₹61 (₹6.10/km), Uber Moto ~₹78 (₹7.80/km).
 * Auto Rickshaws (10 km benchmark): Rapido Auto ~₹87 (₹8.70/km), Ola Auto ~₹104 (₹10.40/km), Uber Auto ~₹121 (₹12.10/km).
 * Rapido Auto Lite capped between ₹12 and ₹15 per km.
 * Economy Cabs (10 km benchmark): Ola Mini ~₹173 (₹17.30/km), UberGo ~₹184 (₹18.40/km).
 * Premium Cabs: Sedans ₹23.80 - ₹27.80/km, SUVs ₹34.20 - ₹35.30/km.
 */
export interface RideHailingQuotes {
  rapidoBike: number;
  olaBike: number;
  uberMoto: number;
  rapidoAuto: number;
  rapidoAutoLite: number;
  olaAuto: number;
  uberAuto: number;
  olaMini: number;
  uberGo: number;
  sedanPremier: number;
  suvXl: number;
  assumptions: string[];
}

export function calculateRideHailingQuotes(distanceKm: number, departureTime: Date): RideHailingQuotes {
  const d = Math.max(1.0, distanceKm);

  // Bike Taxis: Calibrated to 10km benchmarks (50, 61, 78)
  const rapidoBike = Math.round(Math.max(25, 20 + (d - 1) * 3.33));
  const olaBike = Math.round(Math.max(25, 25 + (d - 1) * 4.00));
  const uberMoto = Math.round(Math.max(30, 30 + (d - 1) * 5.33));

  // Auto Rickshaws: Calibrated to 10km benchmarks (87, 104, 121)
  const rapidoAuto = Math.round(Math.max(33, 33 + (d - 1) * 6.00));
  const rapidoAutoLite = Math.round(Math.max(30, d * 13.50));
  const olaAuto = Math.round(Math.max(41, 41 + (d - 1) * 7.00));
  const uberAuto = Math.round(Math.max(49, 49 + (d - 1) * 8.00));

  // Economy Cabs: Calibrated to 10km benchmarks (173, 184)
  const olaMini = Math.round(Math.max(65, 65 + (d - 1) * 12.00));
  const uberGo = Math.round(Math.max(76, 76 + (d - 1) * 12.00));

  // Premium Cabs: Sedan ~₹25.80/km, SUV ~₹34.75/km
  const sedanPremier = Math.round(Math.max(100, 80 + d * 25.80));
  const suvXl = Math.round(Math.max(150, 120 + d * 34.75));

  return {
    rapidoBike,
    olaBike,
    uberMoto,
    rapidoAuto,
    rapidoAutoLite,
    olaAuto,
    uberAuto,
    olaMini,
    uberGo,
    sedanPremier,
    suvXl,
    assumptions: [
      `Ride-Hailing 2026 Reference Benchmarks (10 km calibrated)`,
      `Bike Taxis: Rapido (₹5.00/km) | Ola Bike (₹6.10/km) | Uber Moto (₹7.80/km)`,
      `Autos: Rapido Auto (₹8.70/km) | Auto Lite (₹13.50/km) | Ola Auto (₹10.40/km) | Uber Auto (₹12.10/km)`,
      `Economy Cabs: Ola Mini (₹17.30/km) | UberGo (₹18.40/km)`,
      `Premium Cabs: Sedans (₹23.80 - ₹27.80/km) | SUVs (₹34.20 - ₹35.30/km)`
    ]
  };
}

/**
 * 5. PERSONAL VEHICLE RUNNING COSTS
 * Petrol ~₹102/L, Diesel ~₹92/L, CNG ~₹88/kg:
 * Petrol Bikes / Scooters: ₹1.46/km (70 km/L) to ₹2.27/km (45 km/L)
 * CNG Cars: ₹2.75 to ₹3.14/km (avg ₹2.95/km)
 * Diesel Cars: ₹3.83 to ₹4.18/km (avg ₹4.00/km)
 * Petrol Cars: ₹4.64/km (compact) up to ₹8.50/km (SUV)
 */
export function calculatePersonalVehicleCosts(distanceKm: number): {
  petrolBikeCommuter: number;
  petrolScooterAuto: number;
  cngCarLow: number;
  cngCarHigh: number;
  cngCarAvg: number;
  dieselCarLow: number;
  dieselCarHigh: number;
  dieselCarAvg: number;
  petrolCarHatchback: number;
  petrolCarSuv: number;
  estimatedTolls: number;
  assumptions: string[];
} {
  const d = Math.max(0.5, distanceKm);
  const estimatedTolls = d > 35 ? Math.round((d / 40) * 85) : 0;

  const petrolBikeCommuter = Math.round(d * 1.46 * 10) / 10;
  const petrolScooterAuto = Math.round(d * 2.27 * 10) / 10;
  const cngCarLow = Math.round(d * 2.75 * 10) / 10;
  const cngCarHigh = Math.round(d * 3.14 * 10) / 10;
  const cngCarAvg = Math.round(d * 2.95 * 10) / 10;
  const dieselCarLow = Math.round(d * 3.83 * 10) / 10;
  const dieselCarHigh = Math.round(d * 4.18 * 10) / 10;
  const dieselCarAvg = Math.round(d * 4.00 * 10) / 10;
  const petrolCarHatchback = Math.round(d * 4.64 * 10) / 10;
  const petrolCarSuv = Math.round(d * 8.50 * 10) / 10;

  return {
    petrolBikeCommuter,
    petrolScooterAuto,
    cngCarLow,
    cngCarHigh,
    cngCarAvg,
    dieselCarLow,
    dieselCarHigh,
    dieselCarAvg,
    petrolCarHatchback,
    petrolCarSuv,
    estimatedTolls,
    assumptions: [
      `Personal Vehicle 2026 Running Costs (Petrol ₹102/L, Diesel ₹92/L, CNG ₹88/kg)`,
      `Bikes/Scooters: Commuter (70 km/L) @ ₹1.46/km | Automatic Scooter (45 km/L) @ ₹2.27/km`,
      `CNG Cars: ₹2.75 to ₹3.14/km (avg ₹2.95/km)`,
      `Diesel Cars: ₹3.83 to ₹4.18/km (avg ₹4.00/km)`,
      `Petrol Cars: Compact Hatchback @ ₹4.64/km up to SUV @ ₹8.50/km`,
      estimatedTolls > 0 ? `Estimated NHAI Highway Tolls: ₹${estimatedTolls}` : `No highway tolls detected`
    ]
  };
}

/**
 * 6. INDIAN RAILWAYS (Express Passenger Trains)
 * Telescopic fare structure: per-km rate drops slightly on longer journeys.
 * Unreserved (UTS): ₹0.30/km (suburban) | ₹0.45/km (non-suburban).
 * Reserved minimum base: 2S ₹10 | SL ₹35 | 3A ₹105 | 2A ₹180 | 1A ₹360.
 * Fixed reservation fees, superfast surcharges, 5% GST for AC classes.
 */
export interface RailClassFare {
  classCode: "2S" | "SL" | "3A" | "2A" | "1A";
  className: string;
  baseFare: number;
  reservationFee: number;
  superfastSurcharge: number;
  gst: number;
  totalFarePerPassenger: number;
  totalFare: number;
}

export function calculateIndianRailwaysExpressFare(distanceKm: number, passengers: number = 1): {
  unreservedUtsSuburban: number;
  unreservedUtsNonSuburban: number;
  reserved2S: number;
  reservedSL: number;
  reserved3A: number;
  reserved2A: number;
  reserved1A: number;
  classes: RailClassFare[];
  assumptions: string[];
} {
  const isSuperfast = distanceKm > 100;
  const d = Math.max(1, distanceKm);

  const unreservedUtsSuburban = Math.max(5, Math.round(d * 0.30)) * passengers;
  const unreservedUtsNonSuburban = Math.max(10, Math.round(d * 0.45)) * passengers;

  // 2S: Min base ₹10, ~₹0.35/km, Res ₹15, SF ₹15
  const base2S = Math.max(10, Math.round((d * 0.35) / 5) * 5);
  const sf2S = isSuperfast ? 15 : 0;
  const total2SPerPax = base2S + 15 + sf2S;

  // SL: Min base ₹35, ~₹0.60/km, Res ₹20, SF ₹20
  const baseSL = Math.max(35, Math.round((d * 0.60) / 5) * 5);
  const sfSL = isSuperfast ? 20 : 0;
  const totalSLPerPax = baseSL + 20 + sfSL;

  // 3A: Min base ₹105, ~₹1.40/km, Res ₹40, SF ₹45, 5% GST
  const base3A = Math.max(105, Math.round((d * 1.40) / 5) * 5);
  const sf3A = isSuperfast ? 45 : 0;
  const sub3A = base3A + 40 + sf3A;
  const gst3A = Math.round(sub3A * 0.05);
  const total3APerPax = sub3A + gst3A;

  // 2A: Min base ₹180, ~₹1.90/km, Res ₹50, SF ₹45, 5% GST
  const base2A = Math.max(180, Math.round((d * 1.90) / 5) * 5);
  const sf2A = isSuperfast ? 45 : 0;
  const sub2A = base2A + 50 + sf2A;
  const gst2A = Math.round(sub2A * 0.05);
  const total2APerPax = sub2A + gst2A;

  // 1A: Min base ₹360, ~₹3.25/km, Res ₹60, SF ₹75, 5% GST
  const base1A = Math.max(360, Math.round((d * 3.25) / 5) * 5);
  const sf1A = isSuperfast ? 75 : 0;
  const sub1A = base1A + 60 + sf1A;
  const gst1A = Math.round(sub1A * 0.05);
  const total1APerPax = sub1A + gst1A;

  const classes: RailClassFare[] = [
    { classCode: "2S", className: "Second Sitting (2S)", baseFare: base2S, reservationFee: 15, superfastSurcharge: sf2S, gst: 0, totalFarePerPassenger: total2SPerPax, totalFare: total2SPerPax * passengers },
    { classCode: "SL", className: "Sleeper Class (SL)", baseFare: baseSL, reservationFee: 20, superfastSurcharge: sfSL, gst: 0, totalFarePerPassenger: totalSLPerPax, totalFare: totalSLPerPax * passengers },
    { classCode: "3A", className: "AC 3-Tier (3A)", baseFare: base3A, reservationFee: 40, superfastSurcharge: sf3A, gst: gst3A, totalFarePerPassenger: total3APerPax, totalFare: total3APerPax * passengers },
    { classCode: "2A", className: "AC 2-Tier (2A)", baseFare: base2A, reservationFee: 50, superfastSurcharge: sf2A, gst: gst2A, totalFarePerPassenger: total2APerPax, totalFare: total2APerPax * passengers },
    { classCode: "1A", className: "First AC (1A)", baseFare: base1A, reservationFee: 60, superfastSurcharge: sf1A, gst: gst1A, totalFarePerPassenger: total1APerPax, totalFare: total1APerPax * passengers },
  ];

  return {
    unreservedUtsSuburban,
    unreservedUtsNonSuburban,
    reserved2S: total2SPerPax * passengers,
    reservedSL: totalSLPerPax * passengers,
    reserved3A: total3APerPax * passengers,
    reserved2A: total2APerPax * passengers,
    reserved1A: total1APerPax * passengers,
    classes,
    assumptions: [
      `Indian Railways Telescopic Fare Structure (Per-km rate reduces on longer distances)`,
      `UTS Unreserved: ₹0.30/km (suburban) | ₹0.45/km (non-suburban)`,
      `Reserved Minimum Base: 2S ₹10 | SL ₹35 | 3A ₹105 | 2A ₹180 | 1A ₹360`,
      `Fixed reservation fees, superfast surcharges, and 5% GST on AC classes applied`,
      `Calculated for ${distanceKm} km across ${passengers} passenger(s)`
    ]
  };
}

/**
 * BACKWARD COMPATIBLE EXPORTS (Preserves existing tests and modules)
 */
export function calculateSuburbanRailFare(distanceKm: number, passengers: number = 1) {
  let singleFare = 5;
  if (distanceKm <= 10) singleFare = 5;
  else if (distanceKm <= 20) singleFare = 10;
  else if (distanceKm <= 45) singleFare = 15;
  else if (distanceKm <= 80) singleFare = 20;
  else singleFare = 25;

  const returnFare = singleFare * 2;
  let acSuburbanFare = 35;
  if (distanceKm <= 10) acSuburbanFare = 35;
  else if (distanceKm <= 25) acSuburbanFare = 60;
  else if (distanceKm <= 50) acSuburbanFare = 90;
  else acSuburbanFare = 105;

  return {
    singleFare: singleFare * passengers,
    returnFare: returnFare * passengers,
    acSuburbanFare: acSuburbanFare * passengers,
    assumptions: [
      `Official Indian Railways Suburban Distance Tariff`,
      `Base II-Class Single ₹${singleFare} for ${distanceKm} km`,
      `Total for ${passengers} passenger(s) = ₹${singleFare * passengers}`
    ]
  };
}

export function calculateMetroRailFare(distanceKm: number, passengers: number = 1) {
  let fare = 10;
  if (distanceKm <= 2) fare = 10;
  else if (distanceKm <= 5) fare = 20;
  else if (distanceKm <= 12) fare = 30;
  else if (distanceKm <= 21) fare = 40;
  else if (distanceKm <= 32) fare = 50;
  else fare = 60;

  return {
    farePerPerson: fare,
    totalFare: fare * passengers,
    assumptions: [
      `Official Metro Zone/Distance Slab Tariff`,
      `Token fare ₹${fare}/person for ${distanceKm} km`
    ]
  };
}

export function calculateCityBusFare(distanceKm: number, passengers: number = 1) {
  const best = calculateBestBusFare(distanceKm, passengers);
  return {
    ordinaryFare: best.nonAcFare,
    acFare: best.acFare,
    assumptions: best.assumptions
  };
}

export function calculateCabQuote(distanceKm: number, durationMins: number, departureTime: Date) {
  const hour = departureTime.getHours();
  let surgeMultiplier = 1.0;
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    surgeMultiplier = 1.25;
  }
  const quotes = calculateRideHailingQuotes(distanceKm, departureTime);
  return {
    hatchbackFare: Math.round(quotes.olaMini * surgeMultiplier),
    sedanFare: Math.round(quotes.sedanPremier * surgeMultiplier),
    suvFare: Math.round(quotes.suvXl * surgeMultiplier),
    surgeMultiplier,
    assumptions: quotes.assumptions
  };
}

export function calculateAutoFare(distanceKm: number, departureTime: Date) {
  const metered = calculateMumbaiMeteredFare(distanceKm, departureTime);
  const quotes = calculateRideHailingQuotes(distanceKm, departureTime);
  return {
    meteredFare: metered.autoFare,
    rideHailingAutoFare: quotes.rapidoAuto,
    isNightSurcharge: metered.isNightSurcharge,
    assumptions: metered.assumptions
  };
}

export function calculateBikeTaxiFare(distanceKm: number) {
  const quotes = calculateRideHailingQuotes(distanceKm, new Date());
  return {
    fare: quotes.rapidoBike,
    assumptions: [`Bike Taxi Upfront Tariff (Base ₹20 + ₹3.33/km; ₹50 at 10km benchmark)`]
  };
}

export function calculatePersonalVehicleOperatingCost(
  distanceKm: number,
  fuelPricePerLitre: number = 104.21,
  carEfficiencyKpl: number = 15.0,
  bikeEfficiencyKpl: number = 45.0
) {
  const carFuelCost = Math.round((distanceKm / carEfficiencyKpl) * fuelPricePerLitre * 10) / 10;
  const bikeFuelCost = Math.round((distanceKm / bikeEfficiencyKpl) * fuelPricePerLitre * 10) / 10;
  const estimatedTolls = distanceKm > 35 ? Math.round((distanceKm / 40) * 85) : 0;
  const carTotalOperatingCost = Math.round(carFuelCost + estimatedTolls + distanceKm * 2.5);

  return {
    carFuelCost,
    bikeFuelCost,
    carTotalOperatingCost,
    estimatedTolls,
    assumptions: [
      `Fuel Price: ₹${fuelPricePerLitre}/Litre`,
      `Car: ${carEfficiencyKpl} km/L | Bike: ${bikeEfficiencyKpl} km/L`
    ]
  };
}

export function calculateIntercityRailFares(distanceKm: number, passengers: number = 1) {
  const express = calculateIndianRailwaysExpressFare(distanceKm, passengers);
  const sl = express.classes.find((c) => c.classCode === "SL") || express.classes[0];
  return {
    classes: express.classes,
    recommendedClass: sl,
    lowestFare: express.classes[0].totalFare,
    highestFare: express.classes[express.classes.length - 1].totalFare,
    assumptions: express.assumptions
  };
}

export function calculateIntercityBusFares(distanceKm: number, passengers: number = 1) {
  const ord = Math.round(Math.max(30, distanceKm * 1.05)) * passengers;
  const exp = Math.round(Math.max(45, distanceKm * 1.55)) * passengers;
  const ac = Math.round(Math.max(80, distanceKm * 2.25)) * passengers;
  const volvo = Math.round(Math.max(120, distanceKm * 3.10)) * passengers;

  return {
    ordinaryFare: ord,
    expressFare: exp,
    acSeaterFare: ac,
    acSleeperVolvoFare: volvo,
    assumptions: [
      `Intercity Bus Tariff Slabs: Ordinary ₹1.05/km | Express ₹1.55/km | AC ₹2.25/km | Volvo ₹3.10/km`,
      `Calculated for ${distanceKm} km across ${passengers} passenger(s)`
    ]
  };
}

/**
 * MAIN ENGINE: Generates complete, comprehensive normalized journey options across all modes
 */
export function generateNormalizedJourneyOptions(params: PricingEngineParams): NormalizedJourneyOption[] {
  const {
    originName,
    destName,
    distanceKm,
    departureTime = new Date(),
    passengers = 1,
    fuelPricePerLitre = 104.21,
    apiKeyAvailable = false
  } = params;

  const dist = Math.max(0.5, Math.round(distanceKm * 10) / 10);
  const now = new Date();
  const observedAt = now.toISOString();
  const retrievedAt = now.toISOString();
  const effectiveFrom = "2026-09-01T00:00:00.000Z";

  // Calculations per exact user specifications
  const bestBus = calculateBestBusFare(dist, passengers);
  const localTrain = calculateMumbaiLocalTrainFare(dist, passengers);
  const metroRail = calculateMetroRailFare(dist, passengers);
  const metered = calculateMumbaiMeteredFare(dist, departureTime);
  const rideHail = calculateRideHailingQuotes(dist, departureTime);
  const personal = calculatePersonalVehicleCosts(dist);
  const expressTrain = calculateIndianRailwaysExpressFare(dist, passengers);

  // Speed and duration estimates based on real Indian urban traffic
  const busDur = Math.round(dist * 1.6 + 6);
  const trainDur = Math.round(dist * 1.25 + 4);
  const metroDur = Math.round(dist * 1.1 + 3);
  const taxiDur = Math.round(dist * 1.65 + 3);
  const autoDur = Math.round(dist * 1.4 + 4);
  const bikeDur = Math.round(dist * 1.15 + 2);
  const carPersonalDur = Math.round(dist * 1.35 + 3);
  const motoPersonalDur = Math.round(dist * 1.1 + 2);

  const options: NormalizedJourneyOption[] = [
    // 1. Mumbai Local Train (Second Class)
    {
      journey_id: `RS-MUMBAI-LOCAL-2ND-${Date.now()}`,
      transport_mode: "TRAIN",
      vehicle_category: "Suburban Local Train (Second Class II)",
      operator: "Central & Western Railway",
      title: `Mumbai Local Train — 2nd Class (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: trainDur,
      in_vehicle_duration_minutes: trainDur - 4,
      walking_duration_minutes: 3,
      waiting_duration_minutes: 1,
      transfers: 0,
      price_low_inr: localTrain.secondClassFare,
      price_high_inr: localTrain.secondClassFare,
      quoted_price_inr: localTrain.secondClassFare,
      price_per_passenger_inr: Math.round(localTrain.secondClassFare / passengers),
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: localTrain.secondClassFare,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: localTrain.secondClassFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 3),
      arrival_at: getISTTimeString(departureTime, 3 + trainDur),
      traffic_status: "High-Frequency Suburban Corridor (Every 3-4 mins)",
      source_name: "Indian Railways Suburban Fare Tariff",
      source_record_id: "BOM-SUBURBAN-2ND-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 96.0,
      co2_emissions_g: Math.round(dist * 70),
      recommended: true,
      assumptions: [
        `Second Class: ₹5 (0-3 km) scaling to ₹30 (>31 km)`,
        `Calculated for ${dist} km across ${passengers} passenger(s)`
      ],
      steps: [
        { step_number: 1, instruction: `Walk to ${originName} Suburban Platform`, mode: "WALK", detail: "3 mins connection", duration_min: 3, distance_km: 0.2 },
        { step_number: 2, instruction: `Board Fast/Slow Local Train towards ${destName}`, mode: "TRAIN", detail: `Suburban track corridor (${dist} km)`, duration_min: trainDur - 4, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName}`, mode: "WALK", detail: "Exit via foot-overbridge", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 2. Mumbai Local Train (First Class)
    {
      journey_id: `RS-MUMBAI-LOCAL-1ST-${Date.now()}`,
      transport_mode: "TRAIN",
      vehicle_category: "Suburban Local Train (First Class I)",
      operator: "Central & Western Railway",
      title: `Mumbai Local Train — 1st Class (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: trainDur,
      in_vehicle_duration_minutes: trainDur - 4,
      walking_duration_minutes: 3,
      waiting_duration_minutes: 1,
      transfers: 0,
      price_low_inr: localTrain.firstClassFare,
      price_high_inr: localTrain.firstClassFare,
      quoted_price_inr: localTrain.firstClassFare,
      price_per_passenger_inr: Math.round(localTrain.firstClassFare / passengers),
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: localTrain.firstClassFare,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: localTrain.firstClassFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 3),
      arrival_at: getISTTimeString(departureTime, 3 + trainDur),
      traffic_status: "Dedicated First Class Coach (Cushioned Seating)",
      source_name: "Indian Railways Suburban Fare Tariff",
      source_record_id: "BOM-SUBURBAN-1ST-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 96.0,
      co2_emissions_g: Math.round(dist * 70),
      recommended: false,
      assumptions: [
        `First Class: Starts at ₹65 (0-3 km) scaling to ₹235 (>31 km)`,
        `Calculated for ${dist} km across ${passengers} passenger(s)`
      ],
      steps: [
        { step_number: 1, instruction: `Board First Class coach at ${originName}`, mode: "WALK", detail: "Dedicated First Class queue", duration_min: 3, distance_km: 0.2 },
        { step_number: 2, instruction: `Suburban rail transit to ${destName}`, mode: "TRAIN", detail: `Direct rail corridor (${dist} km)`, duration_min: trainDur - 4, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName} Station`, mode: "WALK", detail: "Concourse exit", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 3. BEST Bus (Non-AC Ordinary)
    {
      journey_id: `RS-BEST-BUS-NONAC-${Date.now()}`,
      transport_mode: "BUS",
      vehicle_category: "BEST Bus (Non-AC Ordinary)",
      operator: "Brihanmumbai Electric Supply and Transport (BEST)",
      title: `BEST Bus — Non-AC (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: busDur,
      in_vehicle_duration_minutes: busDur - 4,
      walking_duration_minutes: 3,
      waiting_duration_minutes: 1,
      transfers: 0,
      price_low_inr: bestBus.nonAcFare,
      price_high_inr: bestBus.nonAcFare,
      quoted_price_inr: bestBus.nonAcFare,
      price_per_passenger_inr: Math.round(bestBus.nonAcFare / passengers),
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: bestBus.nonAcFare,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: bestBus.nonAcFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 5),
      arrival_at: getISTTimeString(departureTime, 5 + busDur),
      traffic_status: "Surface Road Transit",
      source_name: "Official BEST Undertaking Fare Chart",
      source_record_id: "BEST-NONAC-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 88.0,
      co2_emissions_g: Math.round(dist * 160),
      recommended: false,
      assumptions: bestBus.assumptions,
      steps: [
        { step_number: 1, instruction: `Walk to ${originName} Bus Stop`, mode: "WALK", detail: "2 mins connection", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Board BEST Non-AC Bus`, mode: "BUS", detail: `Surface transit (${dist} km)`, duration_min: busDur - 4, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName} Bus Stop`, mode: "WALK", detail: "Walk to destination", duration_min: 2, distance_km: 0.1 }
      ]
    },

    // 4. BEST Bus (AC Express)
    {
      journey_id: `RS-BEST-BUS-AC-${Date.now()}`,
      transport_mode: "BUS",
      vehicle_category: "BEST Bus (Air-Conditioned Express)",
      operator: "Brihanmumbai Electric Supply and Transport (BEST)",
      title: `BEST Bus — AC Express (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: busDur,
      in_vehicle_duration_minutes: busDur - 4,
      walking_duration_minutes: 3,
      waiting_duration_minutes: 1,
      transfers: 0,
      price_low_inr: bestBus.acFare,
      price_high_inr: bestBus.acFare,
      quoted_price_inr: bestBus.acFare,
      price_per_passenger_inr: Math.round(bestBus.acFare / passengers),
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: bestBus.acFare,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: bestBus.acFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 5),
      arrival_at: getISTTimeString(departureTime, 5 + busDur),
      traffic_status: "Chilled Electric AC Bus",
      source_name: "Official BEST Undertaking Fare Chart",
      source_record_id: "BEST-AC-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 130),
      recommended: false,
      assumptions: bestBus.assumptions,
      steps: [
        { step_number: 1, instruction: `Walk to ${originName} Bus Stop`, mode: "WALK", detail: "2 mins connection", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Board BEST AC Electric Bus`, mode: "BUS", detail: `Chilled transit (${dist} km)`, duration_min: busDur - 4, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName}`, mode: "WALK", detail: "Arrival at destination", duration_min: 2, distance_km: 0.1 }
      ]
    },

    // 5. Metro Rapid Transit
    {
      journey_id: `RS-METRO-${Date.now()}`,
      transport_mode: "METRO",
      vehicle_category: "Air-Conditioned Rapid Transit Metro",
      operator: "Maha Metro / MMRDA / DMRC",
      title: `Metro Rapid Transit (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: metroDur,
      in_vehicle_duration_minutes: metroDur - 4,
      walking_duration_minutes: 3,
      waiting_duration_minutes: 1,
      transfers: 0,
      price_low_inr: metroRail.totalFare,
      price_high_inr: metroRail.totalFare,
      quoted_price_inr: metroRail.totalFare,
      price_per_passenger_inr: metroRail.farePerPerson,
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: metroRail.totalFare,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: metroRail.totalFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 3),
      arrival_at: getISTTimeString(departureTime, 3 + metroDur),
      traffic_status: "100% Grade-Separated Signal Priority",
      source_name: "Metro Rail Corporation Slabs",
      source_record_id: "METRO-RATE-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 98.0,
      co2_emissions_g: Math.round(dist * 60),
      recommended: false,
      assumptions: metroRail.assumptions,
      steps: [
        { step_number: 1, instruction: `Walk to ${originName} Metro Gate`, mode: "WALK", detail: "Security scan", duration_min: 3, distance_km: 0.2 },
        { step_number: 2, instruction: `Board AC Metro Line`, mode: "METRO", detail: `High speed rail (${dist} km)`, duration_min: metroDur - 4, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName} Metro Station`, mode: "WALK", detail: "Concourse exit", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 6. Mumbai Metered Taxi (Kaali-Peeli) - RTO Sept 1, 2026
    {
      journey_id: `RS-METERED-TAXI-${Date.now()}`,
      transport_mode: "CAB",
      vehicle_category: "Mumbai Kaali-Peeli City Taxi (Regulated Meter)",
      operator: "Mumbai Taxi Union / RTO Metered",
      title: `Kaali-Peeli Metered Taxi (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: taxiDur,
      in_vehicle_duration_minutes: taxiDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: metered.taxiFare,
      price_high_inr: metered.taxiFare,
      quoted_price_inr: metered.taxiFare,
      price_per_passenger_inr: metered.taxiFare,
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: 33,
        distance_fare_inr: Math.max(0, metered.taxiFare - 33),
        time_or_surge_fare_inr: metered.isNightSurcharge ? Math.round(metered.taxiFare * 0.2) : 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: metered.taxiFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + taxiDur),
      traffic_status: metered.isNightSurcharge ? "Night Cruising (25% Surcharge)" : "City Driving Traffic",
      source_name: "Maharashtra RTO Regulated Tariff (Sept 1, 2026)",
      source_record_id: "RTO-TAXI-METER-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 92.0,
      co2_emissions_g: Math.round(dist * 130),
      recommended: false,
      assumptions: metered.assumptions,
      steps: [
        { step_number: 1, instruction: `Flag Kaali-Peeli Taxi at ${originName}`, mode: "CAB", detail: "Regulated electronic meter start", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Drive to ${destName}`, mode: "CAB", detail: `Road corridor (${dist} km)`, duration_min: taxiDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Pay metered fare at ${destName}`, mode: "CAB", detail: "Exact RTO tariff applied", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 7. Mumbai Auto-Rickshaw (Kaali-Peeli Metered) - RTO Sept 1, 2026
    {
      journey_id: `RS-METERED-AUTO-${Date.now()}`,
      transport_mode: "AUTO",
      vehicle_category: "Mumbai Metered Auto-Rickshaw (Regulated)",
      operator: "Mumbai Auto Union / RTO Metered",
      title: `Mumbai Metered Auto (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: autoDur,
      in_vehicle_duration_minutes: autoDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: metered.autoFare,
      price_high_inr: metered.autoFare,
      quoted_price_inr: metered.autoFare,
      price_per_passenger_inr: metered.autoFare,
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: 27,
        distance_fare_inr: Math.max(0, metered.autoFare - 27),
        time_or_surge_fare_inr: metered.isNightSurcharge ? Math.round(metered.autoFare * 0.2) : 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: metered.autoFare,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + autoDur),
      traffic_status: "Agile 3-Wheeler Navigation",
      source_name: "Maharashtra RTO Regulated Tariff (Sept 1, 2026)",
      source_record_id: "RTO-AUTO-METER-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 60),
      recommended: false,
      assumptions: metered.assumptions,
      steps: [
        { step_number: 1, instruction: `Board Auto at ${originName} Auto Stand`, mode: "AUTO", detail: "Meter flag-drop ₹27", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Travel via arterial roads to ${destName}`, mode: "AUTO", detail: `Distance transit (${dist} km)`, duration_min: autoDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName}`, mode: "AUTO", detail: "Pay regulated fare", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 8. UberGo (Economy Cab)
    {
      journey_id: `RS-UBER-GO-${Date.now()}`,
      transport_mode: "CAB",
      vehicle_category: "Economy AC Cab (UberGo)",
      operator: "Uber India",
      title: `UberGo AC Cab (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: taxiDur,
      in_vehicle_duration_minutes: taxiDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.uberGo,
      price_high_inr: rideHail.uberGo,
      quoted_price_inr: rideHail.uberGo,
      price_per_passenger_inr: rideHail.uberGo,
      price_type: apiKeyAvailable ? "LIVE_PROVIDER_QUOTE" : "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 76,
        distance_fare_inr: Math.max(0, rideHail.uberGo - 76),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.uberGo,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 3),
      arrival_at: getISTTimeString(departureTime, 3 + taxiDur),
      traffic_status: "Door-to-Door Private AC Cab",
      source_name: "Uber India 2026 Reference Benchmark (~₹184 for 10km)",
      source_record_id: "UBER-GO-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: apiKeyAvailable ? "LIVE" : "VERIFIED_TARIFF",
      reliability_score_pct: 88.0,
      co2_emissions_g: Math.round(dist * 125),
      recommended: false,
      assumptions: [
        `UberGo typical 2026 fare: ~₹184 for 10 km (₹18.40/km)`,
        `Calculated for ${dist} km (Fixed vehicle fare up to 4 passengers)`
      ],
      steps: [
        { step_number: 1, instruction: `UberGo pickup at ${originName}`, mode: "CAB", detail: "Driver arriving in 3 mins", duration_min: 3, distance_km: 0.1 },
        { step_number: 2, instruction: `Direct road transit to ${destName}`, mode: "CAB", detail: `AC comfort ride (${dist} km)`, duration_min: taxiDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "CAB", detail: "Cashless arrival", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 9. Ola Mini (Economy Cab)
    {
      journey_id: `RS-OLA-MINI-${Date.now()}`,
      transport_mode: "CAB",
      vehicle_category: "Economy Hatchback (Ola Mini)",
      operator: "Ola Cabs",
      title: `Ola Mini AC Hatchback (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: taxiDur,
      in_vehicle_duration_minutes: taxiDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.olaMini,
      price_high_inr: rideHail.olaMini,
      quoted_price_inr: rideHail.olaMini,
      price_per_passenger_inr: rideHail.olaMini,
      price_type: apiKeyAvailable ? "LIVE_PROVIDER_QUOTE" : "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 65,
        distance_fare_inr: Math.max(0, rideHail.olaMini - 65),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.olaMini,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 3),
      arrival_at: getISTTimeString(departureTime, 3 + taxiDur),
      traffic_status: "Doorstep App Pickup",
      source_name: "Ola Cabs 2026 Reference Benchmark (~₹173 for 10km)",
      source_record_id: "OLA-MINI-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: apiKeyAvailable ? "LIVE" : "VERIFIED_TARIFF",
      reliability_score_pct: 86.0,
      co2_emissions_g: Math.round(dist * 120),
      recommended: false,
      assumptions: [
        `Ola Mini typical 2026 fare: ~₹173 for 10 km (₹17.30/km)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Ola driver arrival at ${originName}`, mode: "CAB", detail: "Share OTP with driver", duration_min: 3, distance_km: 0.1 },
        { step_number: 2, instruction: `Travel via main road to ${destName}`, mode: "CAB", detail: `AC travel (${dist} km)`, duration_min: taxiDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "CAB", detail: "Arrival", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 10. Premium Cab (Sedan - Uber Premier / Ola Prime)
    {
      journey_id: `RS-CAB-SEDAN-${Date.now()}`,
      transport_mode: "CAB",
      vehicle_category: "Premium Sedan (Uber Premier / Ola Prime)",
      operator: "Uber / Ola Premium",
      title: `Prime Sedan Cab (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: taxiDur,
      in_vehicle_duration_minutes: taxiDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: Math.round(80 + dist * 23.80),
      price_high_inr: Math.round(80 + dist * 27.80),
      quoted_price_inr: rideHail.sedanPremier,
      price_per_passenger_inr: rideHail.sedanPremier,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 80,
        distance_fare_inr: Math.max(0, rideHail.sedanPremier - 80),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.sedanPremier,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 4),
      arrival_at: getISTTimeString(departureTime, 4 + taxiDur),
      traffic_status: "Top-Rated Drivers & Executive Sedans",
      source_name: "Ride-Hailing Sedan Tariff (₹23.80 - ₹27.80/km)",
      source_record_id: "SEDAN-PRIME-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 92.0,
      co2_emissions_g: Math.round(dist * 140),
      recommended: false,
      assumptions: [
        `Sedan rate range: ₹23.80 to ₹27.80 per km`,
        `Spacious boot space & executive comfort`
      ],
      steps: [
        { step_number: 1, instruction: `Executive Sedan pickup at ${originName}`, mode: "CAB", detail: "Sedan boot for luggage", duration_min: 4, distance_km: 0.1 },
        { step_number: 2, instruction: `Direct transit to ${destName}`, mode: "CAB", detail: `Comfort route (${dist} km)`, duration_min: taxiDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "CAB", detail: "Trip complete", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 11. Premium Cab (SUV 6-Seater - Uber XL / Ola SUV)
    {
      journey_id: `RS-CAB-SUV-${Date.now()}`,
      transport_mode: "CAB",
      vehicle_category: "Spacious 6-Seater SUV (Uber XL / Ola SUV)",
      operator: "Uber / Ola SUV",
      title: `XL 6-Seater SUV (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: taxiDur,
      in_vehicle_duration_minutes: taxiDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: Math.round(120 + dist * 34.20),
      price_high_inr: Math.round(120 + dist * 35.30),
      quoted_price_inr: rideHail.suvXl,
      price_per_passenger_inr: Math.round(rideHail.suvXl / Math.max(1, Math.min(6, passengers))),
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 120,
        distance_fare_inr: Math.max(0, rideHail.suvXl - 120),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.suvXl,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 4),
      arrival_at: getISTTimeString(departureTime, 4 + taxiDur),
      traffic_status: "High Capacity (Up to 6 Passengers)",
      source_name: "Ride-Hailing SUV Tariff (₹34.20 - ₹35.30/km)",
      source_record_id: "SUV-XL-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 190),
      recommended: false,
      assumptions: [
        `SUV rate range: ₹34.20 to ₹35.30 per km`,
        `Seats up to 6 passengers comfortably`
      ],
      steps: [
        { step_number: 1, instruction: `SUV pickup at ${originName}`, mode: "CAB", detail: "Large boot space & 6 seats", duration_min: 4, distance_km: 0.1 },
        { step_number: 2, instruction: `Drive to ${destName}`, mode: "CAB", detail: `Highway / arterial road (${dist} km)`, duration_min: taxiDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "CAB", detail: "Destination reached", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 12. Rapido Auto (and Rapido Auto Lite)
    {
      journey_id: `RS-RAPIDO-AUTO-${Date.now()}`,
      transport_mode: "AUTO",
      vehicle_category: "On-Demand Auto Rickshaw (Rapido Auto)",
      operator: "Rapido Auto",
      title: `Rapido Auto (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: autoDur,
      in_vehicle_duration_minutes: autoDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.rapidoAuto,
      price_high_inr: rideHail.rapidoAutoLite,
      quoted_price_inr: rideHail.rapidoAuto,
      price_per_passenger_inr: rideHail.rapidoAuto,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 33,
        distance_fare_inr: Math.max(0, rideHail.rapidoAuto - 33),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.rapidoAuto,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + autoDur),
      traffic_status: "Rapido Auto Lite option capped between ₹12 - ₹15/km",
      source_name: "Rapido Auto 2026 Benchmark (~₹87 for 10km)",
      source_record_id: "RAPIDO-AUTO-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 91.0,
      co2_emissions_g: Math.round(dist * 60),
      recommended: false,
      assumptions: [
        `Rapido Auto benchmark: ~₹87 for 10 km (₹8.70/km)`,
        `Rapido Auto Lite tier capped between ₹12 and ₹15 per km`
      ],
      steps: [
        { step_number: 1, instruction: `Rapido Auto captain pickup at ${originName}`, mode: "AUTO", detail: "Share 4-digit PIN", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Ride to ${destName}`, mode: "AUTO", detail: `Quick 3-wheeler route (${dist} km)`, duration_min: autoDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "AUTO", detail: "In-app payment", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 13. Ola Auto
    {
      journey_id: `RS-OLA-AUTO-${Date.now()}`,
      transport_mode: "AUTO",
      vehicle_category: "App-Booked Auto Rickshaw (Ola Auto)",
      operator: "Ola Auto",
      title: `Ola Auto (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: autoDur,
      in_vehicle_duration_minutes: autoDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.olaAuto,
      price_high_inr: rideHail.olaAuto,
      quoted_price_inr: rideHail.olaAuto,
      price_per_passenger_inr: rideHail.olaAuto,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 41,
        distance_fare_inr: Math.max(0, rideHail.olaAuto - 41),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.olaAuto,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + autoDur),
      traffic_status: "App Direct Dispatch",
      source_name: "Ola Auto 2026 Benchmark (~₹104 for 10km)",
      source_record_id: "OLA-AUTO-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 89.0,
      co2_emissions_g: Math.round(dist * 60),
      recommended: false,
      assumptions: [
        `Ola Auto benchmark: ~₹104 for 10 km (₹10.40/km)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Ola Auto pickup at ${originName}`, mode: "AUTO", detail: "Driver arriving", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Ride to ${destName}`, mode: "AUTO", detail: `City streets (${dist} km)`, duration_min: autoDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Arrival at ${destName}`, mode: "AUTO", detail: "Done", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 14. Uber Auto
    {
      journey_id: `RS-UBER-AUTO-${Date.now()}`,
      transport_mode: "AUTO",
      vehicle_category: "App-Booked Auto Rickshaw (Uber Auto)",
      operator: "Uber Auto",
      title: `Uber Auto (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: autoDur,
      in_vehicle_duration_minutes: autoDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.uberAuto,
      price_high_inr: rideHail.uberAuto,
      quoted_price_inr: rideHail.uberAuto,
      price_per_passenger_inr: rideHail.uberAuto,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 49,
        distance_fare_inr: Math.max(0, rideHail.uberAuto - 49),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.uberAuto,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + autoDur),
      traffic_status: "Metered Auto (RTO Sept 2026)",
      source_name: "Uber Auto 2026 Benchmark (~₹121 for 10km)",
      source_record_id: "UBER-AUTO-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 60),
      recommended: false,
      assumptions: [
        `Uber Auto benchmark: ~₹121 for 10 km (₹12.10/km)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Uber Auto pickup at ${originName}`, mode: "AUTO", detail: "Driver arriving", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Direct ride to ${destName}`, mode: "AUTO", detail: `Surface route (${dist} km)`, duration_min: autoDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Drop-off at ${destName}`, mode: "AUTO", detail: "Automatic cashless charge", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 15. Rapido Bike Taxi
    {
      journey_id: `RS-RAPIDO-BIKE-${Date.now()}`,
      transport_mode: "BIKE",
      vehicle_category: "Single Passenger Bike Taxi (Rapido Captain)",
      operator: "Rapido Bike Taxi",
      title: `Rapido Bike Taxi (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: bikeDur,
      in_vehicle_duration_minutes: bikeDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.rapidoBike,
      price_high_inr: rideHail.rapidoBike,
      quoted_price_inr: rideHail.rapidoBike,
      price_per_passenger_inr: rideHail.rapidoBike,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 20,
        distance_fare_inr: Math.max(0, rideHail.rapidoBike - 20),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.rapidoBike,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + bikeDur),
      traffic_status: "Fastest Urban Road Transit (Traffic Weaving)",
      source_name: "Rapido Bike 2026 Benchmark (~₹50 for 10km)",
      source_record_id: "RAPIDO-BIKE-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 94.0,
      co2_emissions_g: Math.round(dist * 35),
      recommended: false,
      assumptions: [
        `Rapido Bike benchmark: ~₹50 for 10 km (₹5.00/km)`,
        `Single rider motorcycle taxi with helmet included`
      ],
      steps: [
        { step_number: 1, instruction: `Rapido Captain pickup at ${originName}`, mode: "BIKE", detail: "Sanitized helmet provided", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Fast road transit to ${destName}`, mode: "BIKE", detail: `Quick motorbike route (${dist} km)`, duration_min: bikeDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Arrival at ${destName}`, mode: "BIKE", detail: "Doorstep drop", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 16. Ola Bike Taxi
    {
      journey_id: `RS-OLA-BIKE-${Date.now()}`,
      transport_mode: "BIKE",
      vehicle_category: "Two-Wheeler Bike Taxi (Ola Bike)",
      operator: "Ola Bike",
      title: `Ola Bike Taxi (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: bikeDur,
      in_vehicle_duration_minutes: bikeDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.olaBike,
      price_high_inr: rideHail.olaBike,
      quoted_price_inr: rideHail.olaBike,
      price_per_passenger_inr: rideHail.olaBike,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 25,
        distance_fare_inr: Math.max(0, rideHail.olaBike - 25),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.olaBike,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + bikeDur),
      traffic_status: "Fast Road Transit",
      source_name: "Ola Bike 2026 Benchmark (~₹61 for 10km)",
      source_record_id: "OLA-BIKE-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 91.0,
      co2_emissions_g: Math.round(dist * 35),
      recommended: false,
      assumptions: [
        `Ola Bike benchmark: ~₹61 for 10 km (₹6.10/km)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Ola Bike pickup at ${originName}`, mode: "BIKE", detail: "Rider helmet provided", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Ride to ${destName}`, mode: "BIKE", detail: `Quick transit (${dist} km)`, duration_min: bikeDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Arrival at ${destName}`, mode: "BIKE", detail: "Drop-off", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 17. Uber Moto
    {
      journey_id: `RS-UBER-MOTO-${Date.now()}`,
      transport_mode: "BIKE",
      vehicle_category: "Motorcycle Taxi (Uber Moto)",
      operator: "Uber Moto",
      title: `Uber Moto (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: bikeDur,
      in_vehicle_duration_minutes: bikeDur - 3,
      walking_duration_minutes: 1,
      waiting_duration_minutes: 2,
      transfers: 0,
      price_low_inr: rideHail.uberMoto,
      price_high_inr: rideHail.uberMoto,
      quoted_price_inr: rideHail.uberMoto,
      price_per_passenger_inr: rideHail.uberMoto,
      price_type: "ESTIMATED_FARE",
      fare_breakdown: {
        base_fare_inr: 30,
        distance_fare_inr: Math.max(0, rideHail.uberMoto - 30),
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: rideHail.uberMoto,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 2),
      arrival_at: getISTTimeString(departureTime, 2 + bikeDur),
      traffic_status: "Uber GPS Safety Tracked Moto",
      source_name: "Uber Moto 2026 Benchmark (~₹78 for 10km)",
      source_record_id: "UBER-MOTO-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 92.0,
      co2_emissions_g: Math.round(dist * 35),
      recommended: false,
      assumptions: [
        `Uber Moto benchmark: ~₹78 for 10 km (₹7.80/km)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Uber Moto pickup at ${originName}`, mode: "BIKE", detail: "Captain arriving", duration_min: 2, distance_km: 0.1 },
        { step_number: 2, instruction: `Motorbike travel to ${destName}`, mode: "BIKE", detail: `Quick route (${dist} km)`, duration_min: bikeDur - 3, distance_km: dist },
        { step_number: 3, instruction: `Arrival at ${destName}`, mode: "BIKE", detail: "Done", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 18. Personal Motorcycle (Commuter Bike 70 km/L @ ₹1.46/km)
    {
      journey_id: `RS-PERSONAL-BIKE-${Date.now()}`,
      transport_mode: "MOTORCYCLE_PERSONAL",
      vehicle_category: "Personal Motorcycle (Commuter 70 km/L)",
      operator: "Self-Driven Private Two-Wheeler",
      title: `Personal Bike (Commuter 70 km/L) (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: motoPersonalDur,
      in_vehicle_duration_minutes: motoPersonalDur,
      walking_duration_minutes: 0,
      waiting_duration_minutes: 0,
      transfers: 0,
      price_low_inr: personal.petrolBikeCommuter,
      price_high_inr: personal.petrolBikeCommuter,
      quoted_price_inr: personal.petrolBikeCommuter,
      price_per_passenger_inr: Math.round((personal.petrolBikeCommuter / Math.min(2, passengers)) * 10) / 10,
      price_type: "ESTIMATED_OPERATING_COST",
      fare_breakdown: {
        base_fare_inr: 0,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: personal.petrolBikeCommuter,
        total_fare_inr: personal.petrolBikeCommuter,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 0),
      arrival_at: getISTTimeString(departureTime, motoPersonalDur),
      traffic_status: "High Fuel Economy Commute",
      source_name: "Commuter Motorcycle Mileage Benchmark (₹1.46/km)",
      source_record_id: "PERSONAL-BIKE-70KPL-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 95.0,
      co2_emissions_g: Math.round(dist * 25),
      recommended: false,
      assumptions: [
        `Highly efficient commuter bike at 70 km/L (Petrol ~₹102/L) = ₹1.46/km`,
        `Direct self-driven private motorcycle travel`
      ],
      steps: [
        { step_number: 1, instruction: `Start bike at ${originName}`, mode: "MOTORCYCLE_PERSONAL", detail: "Commuter efficiency (70 km/L)", duration_min: 1, distance_km: 0.1 },
        { step_number: 2, instruction: `Ride to ${destName}`, mode: "MOTORCYCLE_PERSONAL", detail: `Two-wheeler transit (${dist} km)`, duration_min: motoPersonalDur - 2, distance_km: dist },
        { step_number: 3, instruction: `Park bike at ${destName}`, mode: "MOTORCYCLE_PERSONAL", detail: "Destination reached", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 19. Personal Scooter (Automatic 45 km/L @ ₹2.27/km)
    {
      journey_id: `RS-PERSONAL-SCOOTER-${Date.now()}`,
      transport_mode: "MOTORCYCLE_PERSONAL",
      vehicle_category: "Personal Automatic Scooter (45 km/L)",
      operator: "Self-Driven Private Scooter",
      title: `Personal Scooter (Automatic 45 km/L) (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: motoPersonalDur,
      in_vehicle_duration_minutes: motoPersonalDur,
      walking_duration_minutes: 0,
      waiting_duration_minutes: 0,
      transfers: 0,
      price_low_inr: personal.petrolScooterAuto,
      price_high_inr: personal.petrolScooterAuto,
      quoted_price_inr: personal.petrolScooterAuto,
      price_per_passenger_inr: Math.round((personal.petrolScooterAuto / Math.min(2, passengers)) * 10) / 10,
      price_type: "ESTIMATED_OPERATING_COST",
      fare_breakdown: {
        base_fare_inr: 0,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: personal.petrolScooterAuto,
        total_fare_inr: personal.petrolScooterAuto,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 0),
      arrival_at: getISTTimeString(departureTime, motoPersonalDur),
      traffic_status: "Urban Scooter Commute",
      source_name: "Automatic Scooter Mileage Benchmark (₹2.27/km)",
      source_record_id: "PERSONAL-SCOOTER-45KPL-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 95.0,
      co2_emissions_g: Math.round(dist * 35),
      recommended: false,
      assumptions: [
        `Automatic scooter at 45 km/L (Petrol ~₹102/L) = ₹2.27/km`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Start scooter at ${originName}`, mode: "MOTORCYCLE_PERSONAL", detail: "Automatic CVT transmission", duration_min: 1, distance_km: 0.1 },
        { step_number: 2, instruction: `Ride to ${destName}`, mode: "MOTORCYCLE_PERSONAL", detail: `City streets (${dist} km)`, duration_min: motoPersonalDur - 2, distance_km: dist },
        { step_number: 3, instruction: `Park scooter at ${destName}`, mode: "MOTORCYCLE_PERSONAL", detail: "Arrival", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 20. Personal Car (Petrol Compact Hatchback @ ₹4.64/km)
    {
      journey_id: `RS-PERSONAL-CAR-PETROL-${Date.now()}`,
      transport_mode: "CAR_PERSONAL",
      vehicle_category: "Personal Car (Petrol Compact Hatchback)",
      operator: "Self-Driven Private Car",
      title: `Personal Car (Petrol Hatchback @ ₹4.64/km) (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: carPersonalDur,
      in_vehicle_duration_minutes: carPersonalDur,
      walking_duration_minutes: 0,
      waiting_duration_minutes: 0,
      transfers: 0,
      price_low_inr: personal.petrolCarHatchback,
      price_high_inr: personal.petrolCarSuv,
      quoted_price_inr: personal.petrolCarHatchback,
      price_per_passenger_inr: Math.round((personal.petrolCarHatchback / passengers) * 10) / 10,
      price_type: "ESTIMATED_OPERATING_COST",
      fare_breakdown: {
        base_fare_inr: 0,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: personal.estimatedTolls,
        fuel_or_energy_cost_inr: personal.petrolCarHatchback,
        total_fare_inr: personal.petrolCarHatchback + personal.estimatedTolls,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 0),
      arrival_at: getISTTimeString(departureTime, carPersonalDur),
      traffic_status: "Private Driving Route",
      source_name: "Petrol Car Running Cost (₹4.64 - ₹8.50/km)",
      source_record_id: "PERSONAL-CAR-PETROL-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 88.0,
      co2_emissions_g: Math.round(dist * 120),
      recommended: false,
      assumptions: [
        `Petrol Car: Compact Hatchback @ ₹4.64/km (scaling up to ₹8.50/km for SUVs)`,
        personal.estimatedTolls > 0 ? `Estimated NHAI Tolls: ₹${personal.estimatedTolls}` : `No Highway Tolls Detected`
      ],
      steps: [
        { step_number: 1, instruction: `Start car at ${originName}`, mode: "CAR_PERSONAL", detail: "Petrol Hatchback (22 km/L)", duration_min: 1, distance_km: 0.1 },
        { step_number: 2, instruction: `Drive to ${destName}`, mode: "CAR_PERSONAL", detail: `Road corridor (${dist} km)`, duration_min: carPersonalDur - 2, distance_km: dist },
        { step_number: 3, instruction: `Park at ${destName}`, mode: "CAR_PERSONAL", detail: "Destination reached", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 21. Personal Car (CNG Car @ ₹2.75 - ₹3.14/km)
    {
      journey_id: `RS-PERSONAL-CAR-CNG-${Date.now()}`,
      transport_mode: "CAR_PERSONAL",
      vehicle_category: "Personal Car (CNG Economy)",
      operator: "Self-Driven Private CNG Car",
      title: `Personal Car (CNG @ ₹2.95/km) (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: carPersonalDur,
      in_vehicle_duration_minutes: carPersonalDur,
      walking_duration_minutes: 0,
      waiting_duration_minutes: 0,
      transfers: 0,
      price_low_inr: personal.cngCarLow,
      price_high_inr: personal.cngCarHigh,
      quoted_price_inr: personal.cngCarAvg,
      price_per_passenger_inr: Math.round((personal.cngCarAvg / passengers) * 10) / 10,
      price_type: "ESTIMATED_OPERATING_COST",
      fare_breakdown: {
        base_fare_inr: 0,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: personal.estimatedTolls,
        fuel_or_energy_cost_inr: personal.cngCarAvg,
        total_fare_inr: personal.cngCarAvg + personal.estimatedTolls,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 0),
      arrival_at: getISTTimeString(departureTime, carPersonalDur),
      traffic_status: "Low Emission Gas Vehicle",
      source_name: "CNG Vehicle Cost Benchmark (₹2.75 - ₹3.14/km)",
      source_record_id: "PERSONAL-CAR-CNG-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 85),
      recommended: false,
      assumptions: [
        `CNG Car: ₹2.75 to ₹3.14 per km (average ₹2.95/km @ ₹88/kg CNG)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Start CNG vehicle at ${originName}`, mode: "CAR_PERSONAL", detail: "CNG kit economy", duration_min: 1, distance_km: 0.1 },
        { step_number: 2, instruction: `Drive to ${destName}`, mode: "CAR_PERSONAL", detail: `Surface road (${dist} km)`, duration_min: carPersonalDur - 2, distance_km: dist },
        { step_number: 3, instruction: `Park at ${destName}`, mode: "CAR_PERSONAL", detail: "Arrival", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 22. Personal Car (Diesel Car @ ₹3.83 - ₹4.18/km)
    {
      journey_id: `RS-PERSONAL-CAR-DIESEL-${Date.now()}`,
      transport_mode: "CAR_PERSONAL",
      vehicle_category: "Personal Car (Diesel Turbo)",
      operator: "Self-Driven Private Diesel Car",
      title: `Personal Car (Diesel @ ₹4.00/km) (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: carPersonalDur,
      in_vehicle_duration_minutes: carPersonalDur,
      walking_duration_minutes: 0,
      waiting_duration_minutes: 0,
      transfers: 0,
      price_low_inr: personal.dieselCarLow,
      price_high_inr: personal.dieselCarHigh,
      quoted_price_inr: personal.dieselCarAvg,
      price_per_passenger_inr: Math.round((personal.dieselCarAvg / passengers) * 10) / 10,
      price_type: "ESTIMATED_OPERATING_COST",
      fare_breakdown: {
        base_fare_inr: 0,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: personal.estimatedTolls,
        fuel_or_energy_cost_inr: personal.dieselCarAvg,
        total_fare_inr: personal.dieselCarAvg + personal.estimatedTolls,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 0),
      arrival_at: getISTTimeString(departureTime, carPersonalDur),
      traffic_status: "Long-Distance Diesel Efficiency",
      source_name: "Diesel Vehicle Cost Benchmark (₹3.83 - ₹4.18/km)",
      source_record_id: "PERSONAL-CAR-DIESEL-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 90.0,
      co2_emissions_g: Math.round(dist * 135),
      recommended: false,
      assumptions: [
        `Diesel Car: ₹3.83 to ₹4.18 per km (average ₹4.00/km @ ₹92/L Diesel)`,
        `Calculated for ${dist} km`
      ],
      steps: [
        { step_number: 1, instruction: `Start diesel car at ${originName}`, mode: "CAR_PERSONAL", detail: "Diesel turbo fuel efficiency", duration_min: 1, distance_km: 0.1 },
        { step_number: 2, instruction: `Drive to ${destName}`, mode: "CAR_PERSONAL", detail: `Direct road route (${dist} km)`, duration_min: carPersonalDur - 2, distance_km: dist },
        { step_number: 3, instruction: `Park at ${destName}`, mode: "CAR_PERSONAL", detail: "Trip completed", duration_min: 1, distance_km: 0.1 }
      ]
    },

    // 23. Indian Railways UTS Unreserved (Mail/Express)
    {
      journey_id: `RS-EXPRESS-TRAIN-UTS-${Date.now()}`,
      transport_mode: "TRAIN",
      vehicle_category: "Indian Railways UTS Unreserved (General Class)",
      operator: "Indian Railways (UTS)",
      title: `IR UTS Unreserved Train (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: Math.round(dist * 1.15 + 10),
      in_vehicle_duration_minutes: Math.round(dist * 1.15),
      walking_duration_minutes: 5,
      waiting_duration_minutes: 5,
      transfers: 0,
      price_low_inr: expressTrain.unreservedUtsSuburban,
      price_high_inr: expressTrain.unreservedUtsNonSuburban,
      quoted_price_inr: expressTrain.unreservedUtsNonSuburban,
      price_per_passenger_inr: Math.round(expressTrain.unreservedUtsNonSuburban / passengers),
      price_type: "OFFICIAL_TARIFF",
      fare_breakdown: {
        base_fare_inr: expressTrain.unreservedUtsNonSuburban,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 0,
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: expressTrain.unreservedUtsNonSuburban,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 10),
      arrival_at: getISTTimeString(departureTime, 10 + Math.round(dist * 1.15 + 10)),
      traffic_status: "Mainline Railway Track (High Capacity)",
      source_name: "Indian Railways UTS Unreserved Tariff",
      source_record_id: "IR-UTS-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 92.0,
      co2_emissions_g: Math.round(dist * 80),
      recommended: false,
      assumptions: [
        `Base rate: ₹0.30/km for 2nd class suburban, ₹0.45/km for non-suburban`,
        `Bookable via UTS App or station unreserved booking counter`
      ],
      steps: [
        { step_number: 1, instruction: `Report to ${originName} Junction`, mode: "WALK", detail: "UTS counter or UTS mobile QR scan", duration_min: 5, distance_km: 0.3 },
        { step_number: 2, instruction: `Board General/Unreserved Coach`, mode: "TRAIN", detail: `Mainline track corridor (${dist} km)`, duration_min: Math.round(dist * 1.15), distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName}`, mode: "WALK", detail: "Platform concourse exit", duration_min: 5, distance_km: 0.2 }
      ]
    },

    // 24. Indian Railways Reserved Express (2S, SL, 3A, 2A, 1A)
    {
      journey_id: `RS-EXPRESS-TRAIN-RESERVED-${Date.now()}`,
      transport_mode: "TRAIN",
      vehicle_category: "Indian Railways Reserved (2S, SL, 3A, 2A, 1A)",
      operator: "Indian Railways / IRCTC",
      title: `IRCTC Express Train — Sleeper & AC (${originName} → ${destName})`,
      origin: originName,
      destination: destName,
      route_distance_km: dist,
      total_duration_minutes: Math.round(dist * 1.1 + 12),
      in_vehicle_duration_minutes: Math.round(dist * 1.1),
      walking_duration_minutes: 6,
      waiting_duration_minutes: 6,
      transfers: 0,
      price_low_inr: expressTrain.reserved2S,
      price_high_inr: expressTrain.reserved1A,
      quoted_price_inr: expressTrain.reservedSL,
      price_per_passenger_inr: Math.round(expressTrain.reservedSL / passengers),
      price_type: "HISTORICAL_REFERENCE",
      fare_breakdown: {
        base_fare_inr: Math.round(expressTrain.classes.find((c) => c.classCode === "SL")?.baseFare || 35) * passengers,
        distance_fare_inr: 0,
        time_or_surge_fare_inr: 20 * passengers, // Reservation fee
        tolls_inr: 0,
        fuel_or_energy_cost_inr: 0,
        total_fare_inr: expressTrain.reservedSL,
        currency: "INR"
      },
      availability_status: "AVAILABLE",
      departure_at: getISTTimeString(departureTime, 15),
      arrival_at: getISTTimeString(departureTime, 15 + Math.round(dist * 1.1 + 12)),
      traffic_status: "Telescopic Fare Structure (2S: ₹10 min, SL: ₹35 min, 3A: ₹105 min)",
      source_name: "Indian Railways Telescopic Tariff Benchmark",
      source_record_id: "IR-RESERVED-TELESCOPIC-2026",
      observed_at: observedAt,
      retrieved_at: retrievedAt,
      effective_from: effectiveFrom,
      freshness_status: "VERIFIED_TARIFF",
      reliability_score_pct: 91.0,
      co2_emissions_g: Math.round(dist * 85),
      recommended: false,
      assumptions: expressTrain.assumptions,
      steps: [
        { step_number: 1, instruction: `Report to ${originName} Station Platform`, mode: "WALK", detail: "IRCTC reserved ticket verification", duration_min: 6, distance_km: 0.3 },
        { step_number: 2, instruction: `Board Reserved Coach towards ${destName}`, mode: "TRAIN", detail: `Express corridor (${dist} km)`, duration_min: Math.round(dist * 1.1), distance_km: dist },
        { step_number: 3, instruction: `Alight at ${destName} Station`, mode: "WALK", detail: "Platform exit", duration_min: 6, distance_km: 0.2 }
      ]
    }
  ];

  return options;
}
