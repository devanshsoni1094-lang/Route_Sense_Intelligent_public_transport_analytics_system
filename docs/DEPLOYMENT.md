# ROUTE SENSE — VERCEL & PRODUCTION DEPLOYMENT GUIDE

## Deployment Overview
Route Sense is fully optimized for single-click deployment on **Vercel** as a high-performance Next.js application.

## Vercel Deployment Steps

1. **Push Code to GitHub Repository**:
   ```bash
   git add .
   git commit -m "feat: Real-time India Mobility Pricing & Journey Intelligence Engine"
   git push origin main
   ```

2. **Import Repository in Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Select `Route_Sense_Intelligent_public_transport_analytics_system`.

3. **Configure Environment Variables (Optional)**:
   - `GOOGLE_MAPS_API_KEY`: Your Google Cloud Places & Directions API Key.
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Public client-side Google Maps key.

4. **Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Deploy**:
   - Click **Deploy**. Vercel will build and serve the application globally with SSL and edge caching.
