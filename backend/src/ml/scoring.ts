/**
 * ML Scoring Service
 * Calculates user-specific suitability scores for surf windows
 * 
 * Phase 1 (0-2 sessions): Generic heuristic scoring
 * Phase 2 (3-9 sessions): Blended (50% generic + 50% learned)
 * Phase 3 (10+ sessions): Fully learned model
 */

import type { 
  ForecastSnapshot, 
  User, 
  Session,
  WindOrientation,
  UserInsights
} from '../types/index.js';

// ML Regression library (optional, falls back to simple implementation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MultivariateLinearRegression: any = null;
try {
  // Dynamic require for optional dependency
  const mlRegression = require('ml-regression');
  MultivariateLinearRegression = mlRegression.MultivariateLinearRegression;
} catch {
  // Fallback: we'll use simple averaging
  console.log('ml-regression not available, using fallback scoring');
}

interface ScoringResult {
  score: number;          // 0-100
  explanation: string;
  isRecommended: boolean;
}

interface UserPreferences {
  idealWaveSizeMin: number;
  idealWaveSizeMax: number;
  crowdTolerance: number;
  preferredTimes: string[];
}

/**
 * Get time of day bucket from timestamp
 */
function getTimeOfDayBucket(timestamp: string): string {
  const hour = new Date(timestamp).getUTCHours();
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Score wind orientation (offshore is best)
 */
function scoreWindOrientation(orientation: WindOrientation | null): number {
  const scores: Record<WindOrientation, number> = {
    'offshore': 100,
    'cross-offshore': 85,
    'cross': 60,
    'cross-onshore': 35,
    'onshore': 15
  };
  return orientation ? scores[orientation] : 50;
}

/**
 * Score wave height relative to user preference
 */
function scoreWaveHeight(
  waveHeight: number | null, 
  idealMin: number, 
  idealMax: number
): number {
  if (waveHeight === null) return 50;
  
  // Perfect match
  if (waveHeight >= idealMin && waveHeight <= idealMax) {
    return 100;
  }
  
  // Too small
  if (waveHeight < idealMin) {
    const diff = idealMin - waveHeight;
    return Math.max(0, 100 - diff * 40); // Lose 40 points per meter below
  }
  
  // Too big
  const diff = waveHeight - idealMax;
  return Math.max(0, 100 - diff * 30); // Lose 30 points per meter above
}

/**
 * Score wind speed (light winds are better for surfing)
 */
function scoreWindSpeed(windSpeed: number | null): number {
  if (windSpeed === null) return 60;
  
  // Wind speed in m/s
  // 0-3 m/s: excellent (calm)
  // 3-6 m/s: good
  // 6-10 m/s: moderate
  // 10+: poor
  
  if (windSpeed <= 3) return 100;
  if (windSpeed <= 6) return 85;
  if (windSpeed <= 10) return 60;
  if (windSpeed <= 15) return 35;
  return 15;
}

/**
 * Score time of day (based on user preferences)
 */
function scoreTimeOfDay(timestamp: string, preferredTimes: string[]): number {
  const bucket = getTimeOfDayBucket(timestamp);
  
  // Morning is generally best for surf (before wind picks up)
  const baseScores: Record<string, number> = {
    'dawn': 90,
    'morning': 95,
    'midday': 70,
    'afternoon': 60,
    'evening': 50
  };
  
  let score = baseScores[bucket] || 50;
  
  // Boost if it's a user-preferred time
  if (preferredTimes.includes(bucket)) {
    score = Math.min(100, score + 10);
  }
  
  return score;
}

/**
 * Phase 1: Generic heuristic scoring
 * Uses predefined weights for conditions
 */
export function calculateGenericScore(
  forecast: ForecastSnapshot,
  prefs: UserPreferences
): ScoringResult {
  // Calculate component scores
  const waveScore = scoreWaveHeight(forecast.wave_height, prefs.idealWaveSizeMin, prefs.idealWaveSizeMax);
  const windOrientationScore = scoreWindOrientation(forecast.wind_orientation);
  const windSpeedScore = scoreWindSpeed(forecast.wind_speed);
  const timeScore = scoreTimeOfDay(forecast.timestamp_utc, prefs.preferredTimes);
  
  // Weighted average
  // Wave conditions are most important (40%)
  // Wind orientation (25%)  
  // Wind speed (20%)
  // Time of day (15%)
  const score = Math.round(
    waveScore * 0.40 +
    windOrientationScore * 0.25 +
    windSpeedScore * 0.20 +
    timeScore * 0.15
  );

  // Generate explanation
  const explanations: string[] = [];
  
  if (waveScore >= 80) {
    explanations.push(`waves in your ideal range`);
  } else if (forecast.wave_height !== null) {
    if (forecast.wave_height < prefs.idealWaveSizeMin) {
      explanations.push(`waves a bit small for you`);
    } else {
      explanations.push(`waves bigger than your preference`);
    }
  }
  
  if (windOrientationScore >= 80 && forecast.wind_orientation) {
    explanations.push(`${forecast.wind_orientation} winds`);
  } else if (windOrientationScore < 50 && forecast.wind_orientation) {
    explanations.push(`${forecast.wind_orientation} winds may affect conditions`);
  }

  const explanation = explanations.length > 0 
    ? explanations.join(', ')
    : 'Based on general conditions';

  return {
    score,
    explanation: explanation.charAt(0).toUpperCase() + explanation.slice(1),
    isRecommended: score >= 75
  };
}

/**
 * Extract features from a forecast for ML
 */
function extractFeatures(forecast: ForecastSnapshot): number[] {
  const windOrientationMap: Record<WindOrientation, number> = {
    'offshore': 1.0,
    'cross-offshore': 0.75,
    'cross': 0.5,
    'cross-onshore': 0.25,
    'onshore': 0.0
  };

  const timeOfDay = getTimeOfDayBucket(forecast.timestamp_utc);
  const timeMap: Record<string, number> = {
    'dawn': 0.9,
    'morning': 1.0,
    'midday': 0.6,
    'afternoon': 0.5,
    'evening': 0.4
  };

  return [
    forecast.wave_height ?? 1.0,
    forecast.wave_period ?? 10,
    (forecast.wind_speed ?? 5) / 10, // Normalize
    forecast.wind_orientation ? windOrientationMap[forecast.wind_orientation] : 0.5,
    timeMap[timeOfDay] ?? 0.5
  ];
}

/**
 * Train a simple linear regression model from user sessions
 */
export function trainUserModel(
  sessions: Array<{ forecast: ForecastSnapshot; rating: number }>
): { coefficients: number[]; intercept: number } | null {
  if (sessions.length < 3) return null;

  // Extract features and targets
  const X: number[][] = sessions.map(s => extractFeatures(s.forecast));
  const y: number[] = sessions.map(s => s.rating);

  if (MultivariateLinearRegression) {
    try {
      const regression = new MultivariateLinearRegression(X, y);
      return {
        coefficients: regression.weights.slice(0, -1),
        intercept: regression.weights[regression.weights.length - 1]
      };
    } catch (error) {
      console.error('ML training error:', error);
      return null;
    }
  }

  // Fallback: simple weighted average based on features
  // Calculate average rating for different conditions
  const avgRating = y.reduce((a, b) => a + b, 0) / y.length;
  
  return {
    coefficients: [0.5, 0.1, -0.3, 2.0, 0.5], // Approximate weights
    intercept: avgRating
  };
}

/**
 * Predict rating using trained model
 */
function predictWithModel(
  forecast: ForecastSnapshot,
  model: { coefficients: number[]; intercept: number }
): number {
  const features = extractFeatures(forecast);
  
  let prediction = model.intercept;
  for (let i = 0; i < Math.min(features.length, model.coefficients.length); i++) {
    prediction += features[i] * model.coefficients[i];
  }
  
  // Clamp to 1-10 range and convert to 0-100
  const rating = Math.max(1, Math.min(10, prediction));
  return Math.round(rating * 10);
}

/**
 * Phase 2 & 3: ML-based scoring
 */
export function calculateLearnedScore(
  forecast: ForecastSnapshot,
  prefs: UserPreferences,
  model: { coefficients: number[]; intercept: number },
  numSessions: number
): ScoringResult {
  const genericResult = calculateGenericScore(forecast, prefs);
  const learnedScore = predictWithModel(forecast, model);

  let finalScore: number;
  let blendInfo: string;

  if (numSessions < 10) {
    // Phase 2: Blend 50/50
    finalScore = Math.round(genericResult.score * 0.5 + learnedScore * 0.5);
    blendInfo = 'Based on your style + general patterns';
  } else {
    // Phase 3: Fully learned
    finalScore = learnedScore;
    blendInfo = 'Personalized to your preferences';
  }

  // Build explanation
  const explanations: string[] = [];
  
  if (finalScore >= 80) {
    explanations.push('Similar to your highest-rated sessions');
  } else if (finalScore >= 60) {
    explanations.push('Conditions you tend to enjoy');
  } else {
    explanations.push('May not match your typical preferences');
  }

  // Add specific condition notes
  if (forecast.wind_orientation === 'offshore') {
    explanations.push('clean offshore winds');
  }
  
  if (forecast.wave_height && forecast.wave_height >= prefs.idealWaveSizeMin && 
      forecast.wave_height <= prefs.idealWaveSizeMax) {
    explanations.push('ideal wave size');
  }

  return {
    score: finalScore,
    explanation: `${blendInfo}. ${explanations.join(', ')}.`,
    isRecommended: finalScore >= 75
  };
}

/**
 * Calculate user insights from their sessions
 */
export function calculateUserInsights(
  sessions: Array<{ forecast: ForecastSnapshot; rating: number }>
): UserInsights | null {
  if (sessions.length < 3) return null;

  // Filter to good sessions (rating >= 7)
  const goodSessions = sessions.filter(s => s.rating >= 7);
  if (goodSessions.length === 0) return null;

  // Calculate averages from good sessions
  const waveHeights = goodSessions
    .map(s => s.forecast.wave_height)
    .filter((h): h is number => h !== null);
  
  const wavePeriods = goodSessions
    .map(s => s.forecast.wave_period)
    .filter((p): p is number => p !== null);

  const windOrientations = goodSessions
    .map(s => s.forecast.wind_orientation)
    .filter((w): w is WindOrientation => w !== null);

  const timesOfDay = goodSessions.map(s => getTimeOfDayBucket(s.forecast.timestamp_utc));

  // Find most common wind orientation
  const windCounts = windOrientations.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {} as Record<WindOrientation, number>);
  
  const preferredWind = Object.entries(windCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as WindOrientation || 'offshore';

  // Find most common time
  const timeCounts = timesOfDay.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const preferredTime = Object.entries(timeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'morning';

  // Calculate averages
  const avgHeight = waveHeights.length > 0 
    ? waveHeights.reduce((a, b) => a + b, 0) / waveHeights.length 
    : 1.5;
  
  const avgPeriod = wavePeriods.length > 0
    ? wavePeriods.reduce((a, b) => a + b, 0) / wavePeriods.length
    : 10;

  const avgRating = sessions.reduce((a, s) => a + s.rating, 0) / sessions.length;

  // Model confidence based on session count
  let confidence: 'low' | 'medium' | 'high';
  if (sessions.length >= 15) confidence = 'high';
  else if (sessions.length >= 8) confidence = 'medium';
  else confidence = 'low';

  return {
    ideal_wave_height_min: Math.max(0.5, avgHeight - 0.5),
    ideal_wave_height_max: avgHeight + 0.5,
    ideal_wave_period_min: Math.max(6, avgPeriod - 2),
    ideal_wave_period_max: avgPeriod + 2,
    preferred_wind: preferredWind,
    preferred_time_of_day: preferredTime,
    crowd_tolerance: 5, // Default, could be derived from perceived_crowd ratings
    total_sessions: sessions.length,
    avg_rating: Math.round(avgRating * 10) / 10,
    model_confidence: confidence
  };
}

/**
 * Main scoring function - routes to appropriate phase
 */
export function scoreWindow(
  forecast: ForecastSnapshot,
  user: User,
  model: { coefficients: number[]; intercept: number } | null,
  numSessions: number
): ScoringResult {
  const prefs: UserPreferences = {
    idealWaveSizeMin: user.ideal_wave_size_min,
    idealWaveSizeMax: user.ideal_wave_size_max,
    crowdTolerance: user.crowd_tolerance,
    preferredTimes: user.preferred_times_of_day
  };

  // Phase 1: Generic scoring (0-2 sessions)
  if (numSessions < 3 || !model) {
    return calculateGenericScore(forecast, prefs);
  }

  // Phase 2 & 3: Learned scoring
  return calculateLearnedScore(forecast, prefs, model, numSessions);
}
