/**
 * Mumbai Metropolitan Region (MMR) Geofencing & Location Verification
 * Covers Mumbai City, Mumbai Suburban, Thane, Navi Mumbai, Kalyan-Dombivli,
 * Mira-Bhayandar, Vasai-Virar, Ulhasnagar, Bhiwandi, Panvel, and adjoining commuter belts.
 */

export function isWithinMumbaiMMR(lat: number, lng: number, placeName: string): boolean {
  const q = placeName.toLowerCase();

  // Explicit non-MMR cities and regions
  const nonMmrExclusions = [
    "delhi", "new delhi", "bengaluru", "bangalore", "pune", "chennai", "kolkata",
    "hyderabad", "ahmedabad", "jaipur", "surat", "lucknow", "kanpur", "nagpur",
    "indore", "bhopal", "patna", "vadodara", "ghaziabad", "ludhiana", "agra",
    "nashik", "faridabad", "meerut", "rajkot", "varanasi", "srinagar", "aurangabad",
    "dhanbad", "amritsar", "noida", "gurgaon", "gurugram", "chandigarh",
    "karnataka", "tamil nadu", "uttar pradesh", "gujarat", "rajasthan", "kerala",
    "bihar", "west bengal", "haryana", "punjab", "madhya pradesh", "andhra pradesh",
    "telangana", "odisha", "assam", "goa"
  ];

  for (const exclusion of nonMmrExclusions) {
    const regex = new RegExp(`\\b${exclusion}\\b`, "i");
    if (regex.test(q)) {
      const hasMumbaiLocality = [
        "dadar", "csmt", "cst", "churchgate", "andheri", "bandra", "borivali", "thane",
        "navi mumbai", "vashi", "kurla", "ghatkopar", "bkc", "colaba", "worli", "mumbai"
      ].some((m) => q.includes(m));

      // If it doesn't clearly contain an MMR locality or the whole string is just the external city
      if (!hasMumbaiLocality || q.trim() === exclusion) {
        return false;
      }
    }
  }

  if (lat !== 0 && lng !== 0) {
    // Latitude [18.65 to 19.65] and Longitude [72.65 to 73.40] covers MMR thoroughly
    const inBounds = lat >= 18.65 && lat <= 19.65 && lng >= 72.65 && lng <= 73.40;
    if (!inBounds) return false;
  }

  const mmrKeywords = [
    "mumbai", "bombay", "dadar", "csmt", "cst", "churchgate", "andheri", "bandra", "borivali", "thane",
    "navi mumbai", "vashi", "kalyan", "dombivli", "kurla", "ghatkopar", "bkc", "colaba", "worli",
    "byculla", "parel", "chembur", "sion", "matunga", "mahim", "santacruz", "vile parle", "jogeshwari",
    "goregaon", "malad", "kandivali", "dahisar", "mira", "bhayandar", "vasai", "virar", "panvel", "nerul",
    "belapur", "kharghar", "ulhasnagar", "bhiwandi", "ambernath", "badlapur", "uran", "airoli", "ghansoli",
    "kopar khairane", "seepz", "marol", "saki naka", "powai", "mulund", "bhandup", "kanjurmarg", "vidyavihar",
    "marine lines", "charni road", "grant road", "mumbai central", "lower parel", "prabhadevi", "wadala",
    "sewri", "cotton green", "reay road", "dockyard", "sandhurst", "masjid", "gtb nagar", "chunabhatti",
    "tilak nagar", "mankhurd", "govandi", "juinagar", "sanpada", "seawoods", "mansarovar", "khandeshwar",
    "digha", "turbhe", "palghar", "boisar", "dahanu", "karjat", "kasara", "jvlr", "bandstand", "marine drive"
  ];

  return mmrKeywords.some((k) => q.includes(k));
}
