# Security & Privacy Specification — Route Sense

## Overview

Route Sense is built to ensure strict security, privacy protection, secret redaction, and compliance with data protection standards.

---

## 1. Key Security Controls

1. **Zero Secret Leakage**:
   - All private API keys (e.g. `GOOGLE_MAPS_API_KEY`, database credentials) are restricted to server-side Next.js route handlers (`src/app/api/`) and FastAPI backend modules.
   - Client bundle scanners verify that no secret keys are exposed in client-side code.

2. **Input Sanitization & Validation**:
   - All user inputs (origin, destination, search parameters) are sanitized against XSS attacks and validated via Zod schemas.
   - Coordinate bounding checks prevent out-of-bounds spatial injection.

3. **Rate Limiting & Request Throttling**:
   - API route handlers enforce strict rate limits ($100\text{ requests / minute}$ per IP) to prevent abuse and API quota exhaustion.

4. **Privacy & Data Minimization**:
   - No personal geolocation telemetry is permanently logged without explicit consent.
   - Journey logs are anonymized and retained solely for operational metric analysis.
