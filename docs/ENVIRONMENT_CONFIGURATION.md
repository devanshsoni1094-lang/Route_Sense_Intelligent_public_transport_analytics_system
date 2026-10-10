# Environment Configuration & API Keys Guide — Route Sense

## Overview

This guide details all environment variables required for local development and Vercel production deployment.

---

## 1. Environment Variables Matrix

| Variable Name | Required | Scope | Default Value | Purpose |
|---|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Optional | Server | `""` | Google Places & Directions API Key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Client/Server | `""` | Public Maps SDK Key |
| `DATABASE_URL` | Optional | Server | `sqlite:///./iptap.db` | PostgreSQL / SQLite Connection String |
| `NEXT_PUBLIC_API_BASE_URL` | Optional | Client | `""` | API Base URL Override |
| `DEFAULT_CITY` | Required | Server | `Mumbai` | Default geographic region |
| `TIMEZONE` | Required | Server | `Asia/Kolkata` | Application timezone |

---

## 2. `.env.example` Reference File

```env
# Route Sense Environment Variables
# Copy to .env.local for Next.js

GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
DATABASE_URL=sqlite:///./iptap.db
NEXT_PUBLIC_API_BASE_URL=
DEFAULT_CITY=Mumbai
TIMEZONE=Asia/Kolkata
```
