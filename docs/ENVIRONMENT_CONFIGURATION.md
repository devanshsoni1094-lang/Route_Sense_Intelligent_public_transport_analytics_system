# Environment Configuration & Google Maps Platform Setup — Route Sense

## Overview

This guide details all environment variables and Google Cloud Console configurations required for Route Sense.

---

## 1. Environment Variables Matrix

| Variable Name | Required | Scope | Default Value | Description |
|---|---|---|---|---|
| `GOOGLE_MAPS_SERVER_API_KEY` | Recommended | Server Only | `""` | Restricted server-side key for Places API (New & Classic), Geocoding API, and Routes API (Drive & Transit). Never exposed to browser bundles. |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Optional | Client Only | `""` | Browser key for Maps JavaScript SDK, restricted with HTTP Referrer in Google Cloud Console. |
| `GOOGLE_MAPS_API_KEY` | Optional | Server Only | `""` | Backward compatibility fallback server key. |
| `DATABASE_URL` | Optional | Server | `sqlite:///./iptap.db` | PostgreSQL / SQLite Database URI |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | Optional | Client | `IN` | Default region restriction code (`IN` for India) |
| `TIMEZONE` | Required | Server | `Asia/Kolkata` | Application timezone for departure / arrival schedules (IST) |

---

## 2. Google Cloud Console Activation & Security Checklist

To enable live Google Maps Platform data:

1. **Create or Select Google Cloud Project**:
   Open [Google Cloud Console](https://console.cloud.google.com/) and create a project (e.g. `route-sense-india`).

2. **Enable Required APIs**:
   - **Places API (New)** & **Places API** (for autocomplete suggestions & place details)
   - **Routes API** & **Directions API** (for traffic-aware driving and public transit routing)
   - **Geocoding API** (for address & coordinates geocoding)
   - **Maps JavaScript API** (optional, for client-side maps)

3. **Generate & Restrict API Keys**:
   - **Server Key (`GOOGLE_MAPS_SERVER_API_KEY`)**:
     - API Restrictions: Restrict to *Places API (New)*, *Places API*, *Routes API*, *Directions API*, and *Geocoding API*.
     - Application Restrictions: IP addresses or None (serverless / Vercel Edge).
     - Storage: Store in `.env.local` for local development or Vercel Environment Variables in production.
     - Security: Server-side only; never expose through `NEXT_PUBLIC_`.
   - **Browser Key (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`)**:
     - Application Restrictions: Websites / HTTP referrers (e.g. `https://your-domain.vercel.app/*` and `http://localhost:3000/*`).
     - API Restrictions: Restrict to *Maps JavaScript API* only.

4. **Billing**:
   Ensure a valid Google Cloud billing account is linked.

---

## 3. `.env.local` Configuration Example

```env
# Route Sense India — Local Environment Variables
# Add to .env.local (kept out of Git)

GOOGLE_MAPS_SERVER_API_KEY=AIzaSy...your_restricted_server_key
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=AIzaSy...your_restricted_browser_key

# Regional Defaults
NEXT_PUBLIC_DEFAULT_COUNTRY=IN
TIMEZONE=Asia/Kolkata
DATABASE_URL=sqlite:///./iptap.db
```
