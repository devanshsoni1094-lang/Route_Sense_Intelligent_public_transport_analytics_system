export interface OperationalInsight {
  id: string;
  title: string;
  description: string;
  route_id?: string;
  stop_name?: string;
  time_window: string;
  suspected_cause: string;
  supporting_records_count: number;
  evidence_summary: string;
}

export interface RouteSummary {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  otp_pct: number;
  mean_delay_min: number;
  status_label: 'NORMAL' | 'UNDERPERFORMING' | 'SEVERE_DELAY';
}

export interface ExecutiveKpiData {
  operating_mode: 'DEMO DATA' | 'CONNECTED' | 'PRODUCTION';
  agency_name: string;
  scheduled_trips: number;
  completed_trips: number;
  completion_rate_pct: number;
  on_time_performance_pct: number;
  mean_delay_min: number;
  passenger_boardings: number;
  fleet_utilization_pct: number;
  active_disruptions_count: number;
  data_freshness_seconds: number;
  forecasted_demand_next_24h: number;
  insights: OperationalInsight[];
  top_performing_routes: RouteSummary[];
  underperforming_routes: RouteSummary[];
}

export interface RoutePerformance {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  scheduled_trips: number;
  completed_trips: number;
  otp_pct: number;
  mean_delay_min: number;
  median_delay_min: number;
  p90_delay_min: number;
  headway_regularity_pct: number;
  passenger_boardings: number;
  status_label: 'NORMAL' | 'UNDERPERFORMING' | 'SEVERE_DELAY';
}

export interface VehicleTelemetry {
  vehicle_id: string;
  vehicle_number: string;
  route_id?: string;
  route_name?: string;
  trip_id?: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  delay_minutes: number;
  status: 'ON_TIME' | 'DELAYED' | 'STALE';
  last_updated: string;
  is_simulated: boolean;
}

export interface AnomalyAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alert_type: string;
  route_id?: string;
  observed_value: string;
  threshold_value: string;
  evidence: Record<string, any>;
  suggested_action: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESOLVED';
  assigned_to?: string;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  route_id: string;
  problem_title: string;
  proposed_action: string;
  supporting_metrics: Record<string, any>;
  expected_benefit: string;
  estimated_effort: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
}

export interface ForecastMetrics {
  model_id: string;
  target: string;
  version: string;
  algorithm: string;
  mae: number;
  rmse: number;
  wape: number;
  sample_count: number;
  last_trained: string;
}

export interface PredictionPoint {
  timestamp: string;
  observed_value?: number;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
}

export interface RouteStep {
  step_number: number;
  instruction: string;
  mode: 'BUS' | 'TRAIN' | 'CAB' | 'BIKE' | 'WALK';
  detail: string;
  duration_min: number;
  distance_km: number;
}

export interface MultiModalOption {
  mode: 'BUS' | 'TRAIN' | 'CAB' | 'BIKE';
  title: string;
  duration_min: number;
  estimated_delay_min: number;
  fare_inr: number;
  distance_km: number;
  co2_emissions_g: number;
  reliability_score_pct: number;
  occupancy_level: 'LOW' | 'MODERATE' | 'HIGH';
  next_departure: string;
  recommended: boolean;
  steps: RouteStep[];
}
