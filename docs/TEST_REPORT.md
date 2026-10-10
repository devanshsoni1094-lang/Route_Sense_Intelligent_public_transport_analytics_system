# Automated Testing & Verification Report — Route Sense

## Overview

This report details the execution results of automated test suites and production build checks for Route Sense.

---

## 1. Test Summary Overview

| Test Suite | Framework | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Frontend Production Build** | Next.js 14.2.35 Compiler | 30 Static & Dynamic Pages | 30 | 0 | **PASSED** |
| **Backend API & Analytics Suite** | Pytest 9.1.1 (Python 3.13) | 16 Test Cases | 16 | 0 | **PASSED** |

---

## 2. Frontend Build Verification (`cmd /c npm run build`)

```text
  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (30/30) ...
 ✓ Generating static pages (30/30)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    4.2 kB         98.5 kB
├ ○ /_not-found                          873 B          88.3 kB
├ ƒ /api/v1/location/autocomplete        0 B                0 B
├ ƒ /api/v1/location/resolve             0 B                0 B
├ ƒ /api/v1/planner/route                0 B                0 B
└ ○ /planner                             4.21 kB        98.5 kB
+ First Load JS shared by all            87.4 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 3. Backend Test Suite Execution (`cmd /c pytest`)

```text
============================= test session starts =============================
platform win32 -- Python 3.13.0, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\DEVANSH R. SONI\Downloads\BDA_PROJECT_INTELLIGENT_PUBLIC_TRANSPORT_ANALYTICS
plugins: anyio-4.15.1
collected 16 items

backend\tests\test_analytics.py .....                                    [ 31%]
backend\tests\test_api.py .....                                          [ 62%]
backend\tests\test_qa_audit.py ......                                    [100%]

======================= 16 passed, 11 warnings in 3.71s =======================
```
