// SwellMind Type Definitions

export interface Spot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  orientation_degrees: number;
  break_type: 'beach' | 'point' | 'reef';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description?: string;
  is_curated: boolean;
  created_at: string;
}

export interface ForecastSnapshot {
  id: string;
  spot_id: string;
  timestamp_utc: string;
  wave_height: number | null;       // meters
  wave_period: number | null;       // seconds
  wave_direction: number | null;    // degrees
  wind_speed: number | null;        // m/s
  wind_direction: number | null;    // degrees
  wind_orientation: WindOrientation | null;
  data_source: string;
  fetched_at: string;
}

export type WindOrientation = 
  | 'offshore' 
  | 'cross-offshore' 
  | 'cross' 
  | 'cross-onshore' 
  | 'onshore';

export interface Session {
  id: string;
  user_id: string;
  spot_id: string;
  surf_timestamp_utc: string;
  linked_forecast_id: string | null;
  overall_rating: number;           // 1-10
  perceived_wind: 'too_onshore' | 'just_right' | 'too_weak' | null;
  perceived_size: number | null;    // 1-10
  perceived_crowd: number | null;   // 1-10
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  home_region: string;
  ideal_wave_size_min: number;
  ideal_wave_size_max: number;
  crowd_tolerance: number;
  preferred_times_of_day: string[];
  units_wave: 'meters' | 'feet';
  units_wind: 'kmh' | 'knots' | 'mph';
  created_at: string;
  updated_at: string;
}

export interface ForecastUserScore {
  user_id: string;
  forecast_id: string;
  predicted_score: number;          // 0-100
  explanation: string | null;
  model_version: string;
  computed_at: string;
}

export interface UserModelStats {
  user_id: string;
  num_sessions: number;
  model_type: 'generic' | 'blended' | 'learned';
  model_params: Record<string, unknown> | null;
  last_trained_at: string | null;
  training_error: number | null;
}

// API Response Types

export interface ForecastWindow extends ForecastSnapshot {
  score?: number;
  explanation?: string;
  is_recommended?: boolean;
}

export interface UserInsights {
  ideal_wave_height_min: number;
  ideal_wave_height_max: number;
  ideal_wave_period_min: number;
  ideal_wave_period_max: number;
  preferred_wind: WindOrientation;
  preferred_time_of_day: string;
  crowd_tolerance: number;
  total_sessions: number;
  avg_rating: number;
  model_confidence: 'low' | 'medium' | 'high';
}

// Open-Meteo API Types

export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly_units: {
    time: string;
    wave_height: string;
    wave_period: string;
    wave_direction: string;
    wind_wave_height: string;
    wind_wave_period: string;
    wind_wave_direction: string;
  };
  hourly: {
    time: string[];
    wave_height: (number | null)[];
    wave_period: (number | null)[];
    wave_direction: (number | null)[];
    wind_wave_height?: (number | null)[];
    wind_wave_period?: (number | null)[];
    wind_wave_direction?: (number | null)[];
  };
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
    wind_gusts_10m?: (number | null)[];
  };
}
