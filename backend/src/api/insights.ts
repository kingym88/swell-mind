/**
 * Insights API Routes
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { calculateUserInsights } from '../ml/scoring.js';
import type { ForecastSnapshot } from '../types/index.js';

const router = Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Middleware to require authentication
 */
async function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as any).userId = user.id;
  next();
}

/**
 * GET /insights/me
 * Get current user's insights and ideal conditions
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get user's sessions with linked forecasts
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        overall_rating,
        perceived_wind,
        perceived_size,
        perceived_crowd,
        surf_timestamp_utc,
        forecast:forecast_snapshots(*)
      `)
      .eq('user_id', userId)
      .not('linked_forecast_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch insights' });
    }

    if (!sessions || sessions.length === 0) {
      return res.json({
        insights: null,
        message: 'Log some sessions to see your insights!',
        sessions_needed: 3,
        sessions_logged: 0
      });
    }

    if (sessions.length < 3) {
      return res.json({
        insights: null,
        message: `Log ${3 - sessions.length} more session(s) to unlock insights`,
        sessions_needed: 3,
        sessions_logged: sessions.length
      });
    }

    // Prepare data for insights calculation
    const trainingData = sessions
      .filter((s): s is typeof s & { forecast: ForecastSnapshot } => s.forecast !== null)
      .map(s => ({
        forecast: s.forecast,
        rating: s.overall_rating
      }));

    const insights = calculateUserInsights(trainingData);

    // Get model stats
    const { data: modelStats } = await supabase
      .from('user_model_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate rating distribution
    const ratingDistribution = Array(10).fill(0);
    sessions.forEach(s => {
      ratingDistribution[s.overall_rating - 1]++;
    });

    // Calculate sessions by spot with ratings
    const { data: spotBreakdown } = await supabase
      .from('sessions')
      .select(`
        spot:spots(id, name),
        overall_rating
      `)
      .eq('user_id', userId);

    const spotCounts: Record<string, number> = {};
    const spotRatings: Record<string, { total: number; count: number; id: string }> = {};
    
    spotBreakdown?.forEach(s => {
      const spotName = (s.spot as any)?.name || 'Unknown';
      const spotId = (s.spot as any)?.id || '';
      const rating = s.overall_rating;
      
      spotCounts[spotName] = (spotCounts[spotName] || 0) + 1;
      
      if (!spotRatings[spotName]) {
        spotRatings[spotName] = { total: 0, count: 0, id: spotId };
      }
      spotRatings[spotName].total += rating;
      spotRatings[spotName].count += 1;
    });

    // Find best spot (highest average rating with at least 2 sessions)
    let bestSpot: { name: string; id: string; avg_rating: number } | null = null;
    Object.entries(spotRatings).forEach(([name, data]) => {
      if (data.count >= 2) {
        const avgRating = data.total / data.count;
        if (!bestSpot || avgRating > bestSpot.avg_rating) {
          bestSpot = { name, id: data.id, avg_rating: avgRating };
        }
      }
    });

    // If no spot has 2+ sessions, just use the most frequented spot
    if (!bestSpot && Object.keys(spotCounts).length > 0) {
      const mostFrequent = Object.entries(spotCounts)
        .sort((a, b) => b[1] - a[1])[0];
      if (mostFrequent) {
        const spotName = mostFrequent[0];
        const spotData = spotRatings[spotName];
        bestSpot = {
          name: spotName,
          id: spotData?.id || '',
          avg_rating: spotData ? spotData.total / spotData.count : 0
        };
      }
    }

    // Get recent trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const recentSessions = sessions.filter(s => s.surf_timestamp_utc >= thirtyDaysAgo);
    const olderSessions = sessions.filter(s => 
      s.surf_timestamp_utc >= sixtyDaysAgo && s.surf_timestamp_utc < thirtyDaysAgo
    );

    const recentAvgRating = recentSessions.length > 0
      ? recentSessions.reduce((a, s) => a + s.overall_rating, 0) / recentSessions.length
      : null;
    
    const olderAvgRating = olderSessions.length > 0
      ? olderSessions.reduce((a, s) => a + s.overall_rating, 0) / olderSessions.length
      : null;

    let trend = 'stable';
    if (recentAvgRating && olderAvgRating) {
      if (recentAvgRating > olderAvgRating + 0.5) trend = 'improving';
      else if (recentAvgRating < olderAvgRating - 0.5) trend = 'declining';
    }

    return res.json({
      insights,
      best_spot: bestSpot,
      model_stats: modelStats ? {
        model_type: modelStats.model_type,
        last_trained: modelStats.last_trained_at,
        confidence: insights?.model_confidence || 'low'
      } : null,
      statistics: {
        total_sessions: sessions.length,
        sessions_last_30_days: recentSessions.length,
        average_rating: insights?.avg_rating,
        rating_distribution: ratingDistribution,
        sessions_by_spot: spotCounts,
        trend
      },
      recommendations: generateRecommendations(insights, sessions.length)
    });
  } catch (error) {
    console.error('Error in GET /insights/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate personalized recommendations based on insights
 */
function generateRecommendations(
  insights: ReturnType<typeof calculateUserInsights>, 
  sessionCount: number
): string[] {
  const recommendations: string[] = [];

  if (!insights) {
    recommendations.push('Log more sessions to get personalized recommendations');
    return recommendations;
  }

  // Based on model confidence
  if (insights.model_confidence === 'low') {
    recommendations.push(`Log ${10 - sessionCount} more sessions for fully personalized predictions`);
  }

  // Based on preferred conditions
  recommendations.push(
    `Look for ${insights.ideal_wave_height_min.toFixed(1)}-${insights.ideal_wave_height_max.toFixed(1)}m waves with ${insights.preferred_wind} winds`
  );

  recommendations.push(
    `Your best sessions are usually in the ${insights.preferred_time_of_day}`
  );

  // Encourage variety
  if (insights.total_sessions < 20) {
    recommendations.push('Try different spots and conditions to help the model learn your preferences');
  }

  return recommendations;
}

export default router;
