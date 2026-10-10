# Multi-Modal Journey Routing & Step Resolution — Route Sense

## Overview

Route Sense calculates multi-modal journey routes by evaluating mode-specific travel speeds, circuity factors, interchange wait times, and walking legs.

---

## 1. Distance & Duration Formulas

### 1.1 Haversine Straight-Line Distance
$$d = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
where $R = 6371\text{ km}$.

### 1.2 Mode-Specific Circuity Factors & Speeds

| Transport Mode | Circuity Factor | Average Speed (km/h) | Interchange / Wait Time |
|---|---|---|---|
| **Suburban Rail** | $1.15\times$ | $35\text{ km/h}$ | $5 - 10\text{ mins}$ |
| **Express Rail** | $1.20\times$ | $55\text{ km/h}$ | $15 - 30\text{ mins}$ |
| **Metro Rail** | $1.10\times$ | $32\text{ km/h}$ | $3 - 5\text{ mins}$ |
| **City Bus** | $1.35\times$ | $18\text{ km/h}$ | $8 - 15\text{ mins}$ |
| **State Express Bus** | $1.25\times$ | $45\text{ km/h}$ | $10 - 20\text{ mins}$ |
| **Cab / Taxi** | $1.30\times$ | $25\text{ km/h}$ (City) / $55\text{ km/h}$ (Intercity) | $3 - 8\text{ mins}$ |
| **Auto-Rickshaw** | $1.30\times$ | $22\text{ km/h}$ | $2 - 5\text{ mins}$ |
| **Bike Taxi** | $1.25\times$ | $28\text{ km/h}$ | $2 - 4\text{ mins}$ |
| **Personal Car** | $1.30\times$ | $30\text{ km/h}$ | $0\text{ mins}$ |
| **Personal Motorcycle**| $1.25\times$ | $32\text{ km/h}$ | $0\text{ mins}$ |

---

## 2. Multi-Modal Leg Breakdown

Every journey returned by Route Sense is structured as a sequence of discrete legs:
1. **First-Mile Walk**: Origin $\rightarrow$ Nearest Station / Bus Stop ($500\text{m} - 1.2\text{km}$ @ $4.5\text{ km/h}$).
2. **In-Vehicle Leg**: Boarding $\rightarrow$ Alighting Node.
3. **Transfer Leg**: Platform change or interchange walking leg.
4. **Last-Mile Walk**: Alighting Node $\rightarrow$ Destination.

Total Journey Duration:
$$T_{\text{total}} = T_{\text{in-vehicle}} + T_{\text{walking}} + T_{\text{waiting}} + T_{\text{interchange}}$$
