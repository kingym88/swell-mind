/**
 * Open-Meteo Marine Weather API Service
 * Fetches wave and wind forecasts for surf spots
 */

import type { 
  ForecastSnapshot, 
  WindOrientation, 
  OpenMeteoMarineResponse,
  OpenMeteoWeatherResponse 
} from '../types/index.js';

const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Timeout for API requests (10 seconds)
const REQUEST_TIMEOUT = 10000;

/**
 * Fetch marine forecast data from Open-Meteo
 */
async function fetchMarineData(
  lat: number, 
  lng: number, 
  startDate: string, 
  endDate: string
): Promise<OpenMeteoMarineResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wave_height,wave_period,wave_direction',
    start_date: startDate,
    end_date: endDate,
    timezone: 'UTC'
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${MARINE_API_URL}?${params}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Marine API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as OpenMeteoMarineResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch wind data from Open-Meteo Weather API
 * (Marine API may not have wind, so we fetch from weather API)
 */
async function fetchWindData(
  lat: number, 
  lng: number, 
  startDate: string, 
  endDate: string
): Promise<OpenMeteoWeatherResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    start_date: startDate,
    end_date: endDate,
    timezone: 'UTC'
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${WEATHER_API_URL}?${params}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as OpenMeteoWeatherResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculate wind orientation relative to beach facing direction
 */
export function calculateWindOrientation(
  windDirection: number,
  beachOrientation: number
): WindOrientation {
  // Beach orientation is the direction the beach FACES (where waves come from)
  // Wind direction is where wind comes FROM
  
  // Calculate relative angle (0 = wind blowing offshore, 180 = wind blowing onshore)
  let relativeAngle = (windDirection - beachOrientation + 360) % 360;
  
  // If beach faces west (270), and wind is from east (90), that's offshore
  // The difference would be 90 - 270 + 360 = 180 (onshore)
  // Wait, let me recalculate...
  
  // Actually: if beach faces 270 (west), waves come from west
  // Offshore wind blows FROM land TO sea, so FROM east (90)
  // Onshore wind blows FROM sea TO land, so FROM west (270)
  
  // Relative angle = windDirection - beachOrientation
  // 0 = directly onshore (wind same direction as beach faces)
  // 180 = directly offshore (wind opposite to beach)
  
  relativeAngle = (windDirection - beachOrientation + 360) % 360;
  
  if (relativeAngle >= 150 && relativeAngle <= 210) {
    return 'offshore';
  } else if (relativeAngle >= 120 && relativeAngle < 150) {
    return 'cross-offshore';
  } else if (relativeAngle >= 210 && relativeAngle < 240) {
    return 'cross-offshore';
  } else if ((relativeAngle >= 60 && relativeAngle < 120) || 
             (relativeAngle >= 240 && relativeAngle < 300)) {
    return 'cross';
  } else if ((relativeAngle >= 30 && relativeAngle < 60) || 
             (relativeAngle >= 300 && relativeAngle < 330)) {
    return 'cross-onshore';
  } else {
    return 'onshore';
  }
}

/**
 * Filter to 3-hour windows (00:00, 03:00, 06:00, etc.)
 */
function isThreeHourWindow(timeString: string): boolean {
  const date = new Date(timeString);
  const hour = date.getUTCHours();
  return hour % 3 === 0;
}

/**
 * Fetch and merge forecast data into 3-hour windows
 */
export async function fetchForecastWindows(
  spotId: string,
  lat: number,
  lng: number,
  beachOrientation: number,
  startDate: string,
  endDate: string
): Promise<Omit<ForecastSnapshot, 'id' | 'fetched_at'>[]> {
  
  // Fetch both marine and wind data in parallel
  const [marineData, windData] = await Promise.all([
    fetchMarineData(lat, lng, startDate, endDate),
    fetchWindData(lat, lng, startDate, endDate)
  ]);

  const windows: Omit<ForecastSnapshot, 'id' | 'fetched_at'>[] = [];

  // Process marine data (primary source)
  const { time, wave_height, wave_period, wave_direction } = marineData.hourly;

  for (let i = 0; i < time.length; i++) {
    const timeStr = time[i];
    
    // Only include 3-hour windows
    if (!isThreeHourWindow(timeStr)) continue;

    // Find corresponding wind data
    const windIndex = windData.hourly.time.findIndex(t => t === timeStr);
    const windSpeed = windIndex >= 0 ? windData.hourly.wind_speed_10m[windIndex] : null;
    const windDir = windIndex >= 0 ? windData.hourly.wind_direction_10m[windIndex] : null;

    // Calculate wind orientation
    let windOrientation: WindOrientation | null = null;
    if (windDir !== null) {
      windOrientation = calculateWindOrientation(windDir, beachOrientation);
    }

    windows.push({
      spot_id: spotId,
      timestamp_utc: new Date(timeStr).toISOString(),
      wave_height: wave_height[i],
      wave_period: wave_period[i],
      wave_direction: wave_direction[i],
      wind_speed: windSpeed,
      wind_direction: windDir,
      wind_orientation: windOrientation,
      data_source: 'open-meteo'
    });
  }

  return windows;
}

/**
 * Get date range for forecast (7 days back, 7 days forward)
 */
export function getForecastDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // 7 days back
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  
  // 7 days forward
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}
