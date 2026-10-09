# METRICS AND ANALYTICAL METHODOLOGY

**Platform:** Intelligent Public Transport Analytics Platform (IPTAP)

Enforces strict analytical correctness according to Section 7 of the Master Build Prompt.

---

## 1. On-Time Performance (OTP)

$$\text{OTP (\%)} = \left( \frac{\text{Count of Observed Events within } [-1.0\text{ min}, +5.0\text{ min}]}{\text{Total Observed Events}} \right) \times 100$$

- **Early Tolerance:** 1.0 minute early.
- **Late Tolerance:** 5.0 minutes late.
- **Safeguard:** Excludes cancelled or unobserved trips from denominator.

---

## 2. Trip Completion Rate

$$\text{Completion Rate (\%)} = \left( \frac{\text{Completed Trips}}{\text{Eligible Scheduled Trips}} \right) \times 100$$

---

## 3. Headway Regularity Score

$$\text{CV} = \frac{\sigma_{\text{headway}}}{\mu_{\text{headway}}}$$
$$\text{Regularity Score (\%)} = \max\left(0, 100 \times (1 - \text{CV})\right)$$

- Evaluates regularity of bus spacing at high-frequency stops.
- 100% score indicates perfect headway adherence without bus bunching.
