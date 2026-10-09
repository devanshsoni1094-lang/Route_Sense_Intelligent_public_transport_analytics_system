# OPERATIONS RUNBOOK & MAINTENANCE

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Database Seed and Reset Command

To trigger seed generation or reset demo data:

```bash
# Via API call
curl -X POST http://localhost:8000/api/v1/admin/seed
```

---

## 2. Health & Readiness Monitoring Commands

- **Liveness probe:** `curl http://localhost:8000/health`
- **Readiness probe:** `curl http://localhost:8000/readiness`
