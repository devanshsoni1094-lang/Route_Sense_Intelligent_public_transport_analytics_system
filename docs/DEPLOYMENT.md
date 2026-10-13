# Vercel Deployment & Infrastructure Guide — Route Sense

## 1. Overview
Route Sense is built for one-click, production-grade deployment on **Vercel**. It uses Next.js 14 App Router, TypeScript, serverless route handlers, and static optimization.

Repository: `https://github.com/devanshsoni1094-lang/Route_Sense_Intelligent_public_transport_analytics_system`

---

## 2. Google Cloud Platform Prerequisites
Before deploying to Vercel, ensure the following APIs are enabled in your Google Cloud Console project:
1. **Places API (New)** — For place autocomplete and place details resolution.
2. **Routes API** — For computeRoutes (Drive with live traffic and Public Transit).
3. **Directions API** (Classic fallback) — Optional fallback.
4. **Geocoding API** — For coordinate-to-address reverse geocoding.
5. **Maps JavaScript API** — If using client-side interactive Google map tiles.

Ensure billing is activated on the Google Cloud project to prevent `BILLING_REQUIRED` / `REQUEST_DENIED` errors.

---

## 3. Environment Variables Configuration on Vercel
In your Vercel Project Dashboard (`Settings -> Environment Variables`), configure:

| Variable Name | Environment | Value Description |
|---|---|---|
| `GOOGLE_MAPS_SERVER_API_KEY` | Production, Preview, Development | Private server API key restricted to Places, Routes, and Directions APIs. Never exposed to browser bundles. |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Production, Preview, Development | Browser key restricted by HTTP Referrer to your production Vercel domain (e.g. `https://your-domain.vercel.app/*`). |
| `TIMEZONE` | All | `Asia/Kolkata` |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | All | `IN` |
| `DEMO_MODE` | All | `false` |

---

## 4. Build Configuration
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node.js Version**: `18.x` or `20.x`

---

## 5. Verification Checklist
After Vercel finishes deploying:
1. Load the assigned production URL in a browser.
2. Confirm the spatial header displays `Google Maps Platform Active | Asia/Kolkata`.
3. Type an Indian origin (`Dadar Railway Station`) and select from autocomplete suggestions.
4. Type an Indian destination (`Chhatrapati Shivaji Maharaj Terminus`) and select from suggestions.
5. Click **Find Journeys** (or press Enter).
6. Verify multi-modal options populate (Suburban Rail, Metro, Bus, Cab, Auto, Bike, Personal vehicles).
7. Confirm the spatial map renders the decoded glowing route vector corridor and beacons.
8. Expand an option to inspect the itinerary steps, CO2 calculations, and fare breakdown.
