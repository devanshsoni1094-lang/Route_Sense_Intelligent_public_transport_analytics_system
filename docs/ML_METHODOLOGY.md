# MACHINE LEARNING METHODOLOGY (MLOps)

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

---

## 1. Feature Engineering & Split Strategy

- **Train/Test Split:** Strict chronological split (80% historical training, 20% future validation test set) without random shuffling to prevent time-series future-data leakage.
- **Features:** `hour_of_day`, `day_of_week`, `is_weekend`, `lag_1h_demand`, `route_distance_km`.

---

## 2. Quantitative Evaluation Metrics

### Weighted Absolute Percentage Error (WAPE)

$$\text{WAPE (\%)} = \left( \frac{\sum_{i=1}^n |y_i - \hat{y}_i|}{\sum_{i=1}^n |y_i|} \right) \times 100$$

### Mean Absolute Error (MAE)

$$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$

### Root Mean Squared Error (RMSE)

$$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2}$$

---

## 3. Active Models Summary

1. **`ML-DEMAND-RF-v1`**: `RandomForestRegressor (n_estimators=100, max_depth=10)` — WAPE: **6.82%**, MAE: **3.42**.
2. **`ML-DELAY-RIDGE-v1`**: `RidgeRegression (alpha=1.0)` — WAPE: **11.40%**, MAE: **1.85 min**.
