# Environment Configuration & Google Maps Platform Setup — Route Sense

## Overview

This guide details all environment variables and Google Cloud Console configurations required for Route Sense.

---

## 1. Environment Variables Matrix

| Variable Name | Required | Scope | Default Value | Description |
|---|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Recommended | Server Only | `""` | Server-side key for Places API (New & Classic), Geocoding API, and Routes API (Drive & Transit) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Client & Server | `""` | Restricted browser key for Google Maps JavaScript API (HTTP Referrer restricted) |
| `DATABASE_URL` | Optional | Server | `sqlite:///./iptap.db` | PostgreSQL / SQLite Database URI |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | Optional | Client | `IN` | Country boundary filter for places search |
| `TIMEZONE` | Required | Server | `Asia/Kolkata` | Application timezone for departure / arrival schedules |

---

## 2. Google Cloud Console Activation Checklist

To enable full real-world Google Maps Platform functionality:

1. **Create Project**: Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project (e.g. `route-sense-india`).
2. **Enable Required APIs**:
   - **Places API (New)** & **Places API** (for autocomplete & place details)
   - **Routes API** & **Directions API** (for driving & public transit routing)
   - **Geocoding API** (for address resolution & reverse geocoding)
   - **Maps JavaScript API** (optional, for client-side map controls)
3. **Generate & Restrict API Keys**:
   - **Server Key (`GOOGLE_MAPS_API_KEY`)**: Restrict by API (Places, Routes, Directions, Geocoding) and IP address if hosted on a dedicated server.
   - **Browser Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**: Restrict by HTTP referrer (e.g. `https://your-domain.vercel.app/*` and `http://localhost:3000/*`).
4. **Billing**: Ensure a valid billing account is linked to the Google Cloud project.

---

## 3. `.env.example` Reference File

```env
# Route Sense India — Environment Configuration

# Google Maps Platform (Server-Side)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google Maps Platform (Client-Side, Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key_here

# System Defaults
NEXT_PUBLIC_DEFAULT_COUNTRY=IN
TIMEZONE=Asia/Kolkata
DATABASE_URL=sqlite:///./iptap.db
```
