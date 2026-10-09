# SECURITY, PRIVACY & GOVERNMENT GOVERNANCE

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Governance & Legal Compliance Framework

- **Digital Personal Data Protection (DPDP) Act, 2023 & Notified 2025 Rules**: IPTAP processes aggregated transport telemetry and anonymized passenger boarding counts. No Personally Identifiable Information (PII) such as passenger phone numbers or payment details are stored.
- **OWASP Application Security Verification Standard (ASVS)**: Implements parameterized SQL operations via SQLAlchemy ORM, input validation via Pydantic schemas, password hashing using PBKDF2-HMAC-SHA256, and JWT token authentication.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Module / Action | Administrator | Operations Manager | Analyst | Executive Viewer |
| :--- | :---: | :---: | :---: | :---: |
| View Dashboards & KPIs | ✅ | ✅ | ✅ | ✅ |
| Live Operations Telemetry | ✅ | ✅ | ✅ | ✅ |
| Acknowledge / Resolve Alerts | ✅ | ✅ | ❌ | ❌ |
| Review Recommendations | ✅ | ✅ | ❌ | ❌ |
| Upload GTFS / CSV Data | ✅ | ❌ | ✅ | ❌ |
| User & System Admin | ✅ | ❌ | ❌ | ❌ |
