# ACCEPTANCE CHECKLIST MATRIX

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

| Master Build Prompt Requirement | Verification Method | Status |
| :--- | :--- | :---: |
| Real database & backend API | SQLAlchemy models + FastAPI endpoints verified | ✅ VERIFIED |
| Clear `DEMO DATA` status indication | Displayed on header & dashboard overview | ✅ VERIFIED |
| Centralized Metric Definition Layer | `backend/app/core/metrics.py` | ✅ VERIFIED |
| 11 Integrated Application Modules | All 11 Next.js page views & FastAPI routers | ✅ VERIFIED |
| Chronological Train/Test Split (No Leakage) | `backend/app/services/ml_service.py` | ✅ VERIFIED |
| Quantitative ML Metrics (WAPE, MAE, RMSE) | Scikit-Learn evaluation endpoints | ✅ VERIFIED |
| Alert Status Workflow (NEW $\to$ ACKNOWLEDGED $\to$ RESOLVED) | `backend/app/services/anomaly_service.py` | ✅ VERIFIED |
| Human-in-the-Loop Review Workflow | `backend/app/services/recommendation_service.py` | ✅ VERIFIED |
| Transactional GTFS ZIP & CSV Ingestion | `backend/app/services/gtfs_service.py` | ✅ VERIFIED |
| PDF & CSV Export Generation | `backend/app/services/report_service.py` | ✅ VERIFIED |
| JWT Authentication & RBAC Authorization | `backend/app/core/security.py` | ✅ VERIFIED |
| 100% Passing Automated Pytest Suite | Executed in local environment | ✅ VERIFIED |
| Next.js Production Build | `npm run build` verified | ✅ VERIFIED |
| Complete Handover Documentation | All 12 docs created | ✅ VERIFIED |
