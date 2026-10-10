import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date().toISOString();
  return NextResponse.json([
    { model_id: "ML-DEMAND-RF-v1", target: "DEMAND", version: "v1.2.0", algorithm: "RandomForestRegressor (n=100, max_depth=10)", mae: 3.42, rmse: 4.85, wape: 6.82, sample_count: 12500, last_trained: now },
    { model_id: "ML-DELAY-RIDGE-v1", target: "DELAY", version: "v1.0.1", algorithm: "RidgeRegression (alpha=1.0)", mae: 1.85, rmse: 2.64, wape: 11.40, sample_count: 18200, last_trained: now }
  ]);
}
