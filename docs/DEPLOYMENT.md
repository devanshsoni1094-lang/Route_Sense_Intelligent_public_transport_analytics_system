# Vercel Deployment & Infrastructure Guide — Route Sense

## Overview

Route Sense is fully optimized for Vercel production deployment. It leverages Next.js App Router serverless functions, server-side route handlers, and static optimization.

---

## 1. Deployment Steps on Vercel

1. **Connect GitHub Repository**:
   - Repository: `https://github.com/devanshsoni1094-lang/Route_Sense_Intelligent_public_transport_analytics_system`
   - Production Branch: `main`

2. **Framework Preset & Build Commands**:
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Configure Environment Variables**:
   - Add `GOOGLE_MAPS_API_KEY` (Optional for Google Places Autocomplete).
   - Add `TIMEZONE=Asia/Kolkata`.

4. **Deploy & Verify**:
   - Click **Deploy**.
   - Test live journey search functionality on the assigned Vercel URL.
