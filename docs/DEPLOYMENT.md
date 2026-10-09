# DEPLOYMENT AND HARDENING GUIDE

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Single-Command Docker Deployment

Launch full stack (FastAPI backend, Next.js frontend, PostGIS database):

```bash
docker-compose up --build -d
```

---

## 2. Ports & Services Overview

- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend API (FastAPI)**: `http://localhost:8000`
- **OpenAPI Swagger Docs**: `http://localhost:8000/docs`
- **PostgreSQL / PostGIS Database**: `localhost:5432`
