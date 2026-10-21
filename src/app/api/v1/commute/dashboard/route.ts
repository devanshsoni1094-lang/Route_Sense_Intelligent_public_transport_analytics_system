import { NextRequest, NextResponse } from "next/server";
import { UsersDatabase } from "@/lib/db/usersDb";

export interface CommuteLogItem {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  mode: string;
  date: string;
  estimatedDurationMin: number;
  actualDurationMin: number;
  estimatedCostInr: number;
  actualCostInr: number;
  notes?: string;
}

export interface UserPreferences {
  maxWalkingDistanceMeters: number;
  maxTransfers: number;
  maxBudgetInr: number;
  preferElevatorEscalator: boolean;
  preferLadiesCompartment: boolean;
  avoidOvercrowdedPeak: boolean;
  preferredModes: string[];
}

export interface SavedPlace {
  id: string;
  type: "HOME" | "WORK" | "OTHER";
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// In-memory persistent store for development & server sessions
const IN_MEMORY_COMMUTE_STORE = new Map<string, CommuteLogItem[]>();
const IN_MEMORY_PREFERENCES_STORE = new Map<string, UserPreferences>();
const IN_MEMORY_SAVED_PLACES_STORE = new Map<string, SavedPlace[]>();

function getUserId(request: NextRequest): string {
  const sessionToken = request.cookies.get("routesense_session")?.value;
  if (sessionToken) {
    const session = UsersDatabase.verifySessionToken(sessionToken);
    if (session.valid && session.payload?.uid) {
      return session.payload.uid;
    }
  }
  return "usr_mumbai_default";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    // Initialize defaults if not present
    if (!IN_MEMORY_COMMUTE_STORE.has(userId)) {
      IN_MEMORY_COMMUTE_STORE.set(userId, [
        {
          id: "log_1",
          userId,
          origin: "Borivali Station",
          destination: "Churchgate Station",
          mode: "TRAIN",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          estimatedDurationMin: 52,
          actualDurationMin: 55,
          estimatedCostInr: 20,
          actualCostInr: 20,
          notes: "Western Line Fast local — on time."
        },
        {
          id: "log_2",
          userId,
          origin: "Ghatkopar Metro",
          destination: "Andheri Station",
          mode: "METRO",
          date: new Date(Date.now() - 86400000 * 1).toISOString(),
          estimatedDurationMin: 21,
          actualDurationMin: 22,
          estimatedCostInr: 30,
          actualCostInr: 30,
          notes: "Metro Line 1 — air conditioned and smooth."
        },
        {
          id: "log_3",
          userId,
          origin: "Dadar Central",
          destination: "BKC",
          mode: "BUS",
          date: new Date().toISOString(),
          estimatedDurationMin: 35,
          actualDurationMin: 42,
          estimatedCostInr: 15,
          actualCostInr: 15,
          notes: "BEST AC bus route — delay due to Dharavi junction traffic."
        }
      ]);
    }

    if (!IN_MEMORY_PREFERENCES_STORE.has(userId)) {
      IN_MEMORY_PREFERENCES_STORE.set(userId, {
        maxWalkingDistanceMeters: 800,
        maxTransfers: 1,
        maxBudgetInr: 150,
        preferElevatorEscalator: true,
        preferLadiesCompartment: false,
        avoidOvercrowdedPeak: true,
        preferredModes: ["METRO", "TRAIN", "BUS"]
      });
    }

    if (!IN_MEMORY_SAVED_PLACES_STORE.has(userId)) {
      IN_MEMORY_SAVED_PLACES_STORE.set(userId, [
        {
          id: "sp_home",
          type: "HOME",
          name: "Home",
          address: "Borivali West, Mumbai",
          latitude: 19.2291,
          longitude: 72.8569
        },
        {
          id: "sp_work",
          type: "WORK",
          name: "Office (BKC)",
          address: "Bandra Kurla Complex, G-Block, Mumbai",
          latitude: 19.0657,
          longitude: 72.8687
        }
      ]);
    }

    const commuteLogs = IN_MEMORY_COMMUTE_STORE.get(userId) || [];
    const preferences = IN_MEMORY_PREFERENCES_STORE.get(userId);
    const savedPlaces = IN_MEMORY_SAVED_PLACES_STORE.get(userId) || [];

    // Compute Analytics
    const totalSpentInr = commuteLogs.reduce((acc, curr) => acc + curr.actualCostInr, 0);
    const cabEquivalentSpentInr = commuteLogs.reduce((acc, curr) => acc + (curr.actualCostInr * 8 + 120), 0);
    const estimatedSavingsInr = Math.max(0, cabEquivalentSpentInr - totalSpentInr);
    const avgDurationMin = commuteLogs.length > 0
      ? Math.round(commuteLogs.reduce((acc, curr) => acc + curr.actualDurationMin, 0) / commuteLogs.length)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        userId,
        commuteLogs,
        preferences,
        savedPlaces,
        analytics: {
          totalCommutes: commuteLogs.length,
          totalSpentInr,
          monthlyBudgetInr: 3500,
          estimatedSavingsInr,
          avgDurationMin
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DASHBOARD_FETCH_FAILED", message: err?.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const { action, payload } = body;

    if (action === "LOG_COMMUTE") {
      const existing = IN_MEMORY_COMMUTE_STORE.get(userId) || [];
      const newLog: CommuteLogItem = {
        id: `log_${Date.now()}`,
        userId,
        origin: payload.origin || "Mumbai",
        destination: payload.destination || "Mumbai",
        mode: payload.mode || "TRAIN",
        date: payload.date || new Date().toISOString(),
        estimatedDurationMin: Number(payload.estimatedDurationMin) || 30,
        actualDurationMin: Number(payload.actualDurationMin) || 30,
        estimatedCostInr: Number(payload.estimatedCostInr) || 20,
        actualCostInr: Number(payload.actualCostInr) || 20,
        notes: payload.notes || ""
      };
      existing.unshift(newLog);
      IN_MEMORY_COMMUTE_STORE.set(userId, existing);

      return NextResponse.json({
        success: true,
        message: "Commute logged successfully",
        log: newLog
      });
    }

    if (action === "UPDATE_PREFERENCES") {
      const current = IN_MEMORY_PREFERENCES_STORE.get(userId) || {
        maxWalkingDistanceMeters: 800,
        maxTransfers: 1,
        maxBudgetInr: 150,
        preferElevatorEscalator: false,
        preferLadiesCompartment: false,
        avoidOvercrowdedPeak: false,
        preferredModes: ["METRO", "TRAIN", "BUS"]
      };

      const updated: UserPreferences = {
        ...current,
        ...payload
      };
      IN_MEMORY_PREFERENCES_STORE.set(userId, updated);

      return NextResponse.json({
        success: true,
        message: "Preferences updated successfully",
        preferences: updated
      });
    }

    if (action === "SAVE_PLACE") {
      const existing = IN_MEMORY_SAVED_PLACES_STORE.get(userId) || [];
      const newPlace: SavedPlace = {
        id: `sp_${Date.now()}`,
        type: payload.type || "OTHER",
        name: payload.name || "Custom Station",
        address: payload.address || "Mumbai MMR",
        latitude: Number(payload.latitude) || 19.0760,
        longitude: Number(payload.longitude) || 72.8777
      };
      existing.push(newPlace);
      IN_MEMORY_SAVED_PLACES_STORE.set(userId, existing);

      return NextResponse.json({
        success: true,
        message: "Place saved successfully",
        place: newPlace
      });
    }

    return NextResponse.json({ error: "UNKNOWN_ACTION", message: "Invalid dashboard action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DASHBOARD_POST_FAILED", message: err?.message || "Operation failed." },
      { status: 500 }
    );
  }
}
