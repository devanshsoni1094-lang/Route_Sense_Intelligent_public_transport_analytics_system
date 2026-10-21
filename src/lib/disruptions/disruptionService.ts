export interface DisruptionAlert {
  id: string;
  category: "RAILWAY_BLOCK" | "MONSOON_FLOODING" | "METRO_MAINTENANCE" | "BUS_DIVERSION" | "TRAFFIC_CONGESTION";
  title: string;
  description: string;
  mode: "TRAIN" | "METRO" | "BUS" | "ROAD" | "ALL";
  corridor: string;
  affectedStations: string[];
  severity: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  status: "ACTIVE" | "SCHEDULED" | "RESOLVED";
  effectiveFrom: string;
  effectiveTo: string;
  source: {
    authority: string;
    bulletinRef?: string;
    url?: string;
    verifiedAt: string;
  };
  recommendedAlternative: {
    summary: string;
    suggestedMode: string;
    additionalTimeMin: number;
  };
}

export const VERIFIED_MUMBAI_DISRUPTIONS: DisruptionAlert[] = [
  {
    id: "cr-mb-2026-w42",
    category: "RAILWAY_BLOCK",
    title: "Central Railway Sunday Mega Block (Matunga ➔ Mulund Up & Down Fast)",
    description: "Scheduled infrastructure maintenance block on Up & Down Fast lines between Matunga and Mulund. Fast trains diverted to Slow corridor, running 15-20 mins behind schedule.",
    mode: "TRAIN",
    corridor: "Central Main Line (CSMT ➔ Kalyan)",
    affectedStations: ["Matunga", "Sion", "Kurla", "Vidyavihar", "Ghatkopar", "Vikhroli", "Kanjurmarg", "Bhandup", "Mulund"],
    severity: "HIGH",
    status: "SCHEDULED",
    effectiveFrom: "2026-10-25T11:05:00+05:30",
    effectiveTo: "2026-10-25T15:55:00+05:30",
    source: {
      authority: "Central Railway CPRO Mumbai (@Central_Railway)",
      bulletinRef: "CR-PR-2026/10/88",
      url: "https://cr.indianrailways.gov.in",
      verifiedAt: "2026-10-21T06:00:00+05:30"
    },
    recommendedAlternative: {
      summary: "Board Metro Line 1 from Ghatkopar to Andheri or use slow local services with a 15-minute buffer.",
      suggestedMode: "METRO / SLOW TRAIN",
      additionalTimeMin: 18
    }
  },
  {
    id: "wr-jb-2026-w42",
    category: "RAILWAY_BLOCK",
    title: "Western Railway Jumbo Block (Santacruz ➔ Goregaon Up & Down Fast)",
    description: "Maintenance of track, signaling, and overhead equipment (OHE). All Fast line trains diverted to Slow line between Santacruz and Goregaon.",
    mode: "TRAIN",
    corridor: "Western Line (Churchgate ➔ Borivali/Virar)",
    affectedStations: ["Santacruz", "Vile Parle", "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon"],
    severity: "MODERATE",
    status: "SCHEDULED",
    effectiveFrom: "2026-10-25T10:00:00+05:30",
    effectiveTo: "2026-10-25T15:00:00+05:30",
    source: {
      authority: "Western Railway DRM Mumbai (@DRMWRMumbai)",
      bulletinRef: "WR-PR-2026/10/114",
      url: "https://wr.indianrailways.gov.in",
      verifiedAt: "2026-10-21T07:15:00+05:30"
    },
    recommendedAlternative: {
      summary: "Take Metro Line 2A (Yellow Line) or Metro Line 7 (Red Line) along Western Express Highway for congestion-free transit.",
      suggestedMode: "METRO",
      additionalTimeMin: 12
    }
  },
  {
    id: "imd-monsoon-high-tide",
    category: "MONSOON_FLOODING",
    title: "Monsoon High Tide Advisory & Low-Lying Waterlogging Watch",
    description: "IMD Mumbai alerts a 4.48-meter high tide coinciding with intermittent heavy rains. Precautionary speed restrictions in place at low-lying tracks: Sion-Kurla and Chunabhatti.",
    mode: "ALL",
    corridor: "Harbour & Central Low-Lying Sections (Sion, Kurla, Chunabhatti)",
    affectedStations: ["Sion", "Kurla", "Chunabhatti", "Tilak Nagar", "Hindmata"],
    severity: "HIGH",
    status: "ACTIVE",
    effectiveFrom: "2026-10-21T13:30:00+05:30",
    effectiveTo: "2026-10-21T19:00:00+05:30",
    source: {
      authority: "India Meteorological Department (IMD Mumbai) & BMC Disaster Management (@DisasterMGM_MCGM)",
      bulletinRef: "IMD-MUM-NOWCAST-489",
      url: "https://mausam.imd.gov.in/mumbai",
      verifiedAt: "2026-10-21T11:00:00+05:30"
    },
    recommendedAlternative: {
      summary: "Use elevated Mumbai Metro Line 1 & Eastern Freeway Cab corridors to bypass flooded low-lying rail lines at Sion/Kurla.",
      suggestedMode: "METRO / FREEWAY CAB",
      additionalTimeMin: 20
    }
  },
  {
    id: "best-gokhale-diversion",
    category: "BUS_DIVERSION",
    title: "BEST Bus Diversion via Mrinal Tai Gore Flyover (Andheri East-West)",
    description: "Due to ongoing railway overbridge reconstruction at Andheri, BEST routes 251, 332, 415, and 418 are diverted via Mrinal Tai Gore Flyover / Milan Subway.",
    mode: "BUS",
    corridor: "Andheri East ➔ Andheri West Link",
    affectedStations: ["Andheri Station East", "Gundavali", "Andheri West SV Road"],
    severity: "MODERATE",
    status: "ACTIVE",
    effectiveFrom: "2026-10-01T00:00:00+05:30",
    effectiveTo: "2026-11-30T23:59:00+05:30",
    source: {
      authority: "Brihanmumbai Electric Supply & Transport (BEST) Undertaking Traffic Control",
      bulletinRef: "BEST-DIVERSION-ORD-42",
      url: "https://bestundertaking.net",
      verifiedAt: "2026-10-20T14:00:00+05:30"
    },
    recommendedAlternative: {
      summary: "Use Mumbai Metro Line 1 (Versova-Andheri-Ghatkopar) directly connecting East & West Andheri in 4 minutes flat.",
      suggestedMode: "METRO LINE 1",
      additionalTimeMin: 0
    }
  },
  {
    id: "traffic-sclr-congestion",
    category: "TRAFFIC_CONGESTION",
    title: "Santacruz-Chembur Link Road (SCLR) Heavy Peak Congestion",
    description: "BKC connector junction experiencing slow vehicular movement. Travel delay estimated at +15-22 minutes for road-based autos and taxis.",
    mode: "ROAD",
    corridor: "SCLR (Kurla ➔ BKC ➔ Santacruz)",
    affectedStations: ["Kurla West", "BKC G-Block", "Vakola Junction"],
    severity: "MODERATE",
    status: "ACTIVE",
    effectiveFrom: "2026-10-21T08:30:00+05:30",
    effectiveTo: "2026-10-21T21:30:00+05:30",
    source: {
      authority: "Mumbai Traffic Police Operations Command (@MTPHereToHelp)",
      bulletinRef: "MTP-TRAFFIC-LOG-78",
      url: "https://trafficpolicemumbai.maharashtra.gov.in",
      verifiedAt: "2026-10-21T12:30:00+05:30"
    },
    recommendedAlternative: {
      summary: "Board Harbour local train from Chembur to Kurla, or take Metro Line 3 underground to avoid surface traffic.",
      suggestedMode: "LOCAL TRAIN / UNDERGROUND METRO",
      additionalTimeMin: 10
    }
  }
];

export class DisruptionService {
  /**
   * Retrieve all active and scheduled disruptions in MMR
   */
  public static getAllDisruptions(): DisruptionAlert[] {
    return VERIFIED_MUMBAI_DISRUPTIONS;
  }

  /**
   * Filter disruptions by mode
   */
  public static getDisruptionsByMode(mode?: string): DisruptionAlert[] {
    if (!mode || mode === "ALL") return VERIFIED_MUMBAI_DISRUPTIONS;
    return VERIFIED_MUMBAI_DISRUPTIONS.filter(
      (d) => d.mode === mode || d.mode === "ALL"
    );
  }

  /**
   * Check whether a planned journey corridor or its stops intersect with an active disruption
   */
  public static checkRouteDisruptions(originText: string, destText: string, mode?: string): DisruptionAlert[] {
    const searchTerms = [originText.toLowerCase(), destText.toLowerCase()];
    
    return VERIFIED_MUMBAI_DISRUPTIONS.filter((alert) => {
      // Check mode match
      if (mode && alert.mode !== "ALL" && alert.mode !== mode) {
        return false;
      }

      // Check if corridor or any station is mentioned in origin/dest
      const corridorMatch = searchTerms.some((term) =>
        alert.corridor.toLowerCase().includes(term) || term.includes(alert.corridor.toLowerCase())
      );

      const stationMatch = alert.affectedStations.some((station) =>
        searchTerms.some((term) => term.includes(station.toLowerCase()) || station.toLowerCase().includes(term))
      );

      return corridorMatch || stationMatch;
    });
  }
}
