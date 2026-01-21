/**
 * Spots API Routes
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { fetchForecastWindows, getForecastDateRange } from '../services/openmeteo.js';
import { scoreWindow } from '../ml/scoring.js';
import type { Spot, ForecastSnapshot, User } from '../types/index.js';

const router = Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /spots
 * List all curated surf spots
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { region } = req.query;

    let query = supabase
      .from('spots')
      .select('*')
      .eq('is_curated', true)
      .order('name');

    if (region && typeof region === 'string') {
      query = query.eq('region', region);
    }

    const { data: spots, error } = await query;

    if (error) {
      console.error('Error fetching spots:', error);
      return res.status(500).json({ error: 'Failed to fetch spots' });
    }

    return res.json({ spots });
  } catch (error) {
    console.error('Error in GET /spots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /spots/:id
 * Get a single spot by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: spot, error } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    return res.json({ spot });
  } catch (error) {
    console.error('Error in GET /spots/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /spots/:id/windows
 * Get forecast windows for a spot with optional user-specific scores
 */
router.get('/:id/windows', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    // Get user ID from auth header (optional)
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let user: User | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      if (authUser) {
        userId = authUser.id;
        // Fetch user preferences
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        user = userData;
      }
    }

    // Get spot details
    const { data: spot, error: spotError } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .single();

    if (spotError || !spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    // Determine date range
    const defaultRange = getForecastDateRange();
    const startDate = (start_date as string) || defaultRange.startDate;
    const endDate = (end_date as string) || defaultRange.endDate;

    // Check for cached forecasts
    const { data: cachedForecasts } = await supabase
      .from('forecast_snapshots')
      .select('*')
      .eq('spot_id', id)
      .gte('timestamp_utc', `${startDate}T00:00:00Z`)
      .lte('timestamp_utc', `${endDate}T23:59:59Z`)
      .order('timestamp_utc');

    let forecasts: ForecastSnapshot[];

    // Check if cache is stale (older than 6 hours for future forecasts)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const cacheIsFresh = cachedForecasts && 
      cachedForecasts.length > 0 && 
      cachedForecasts[0].fetched_at > sixHoursAgo;

    if (cacheIsFresh) {
      forecasts = cachedForecasts;
    } else {
      // Fetch fresh data from Open-Meteo
      try {
        const freshWindows = await fetchForecastWindows(
          id,
          spot.lat,
          spot.lng,
          spot.orientation_degrees,
          startDate,
          endDate
        );

        // Upsert to database
        if (freshWindows.length > 0) {
          const { error: upsertError } = await supabase
            .from('forecast_snapshots')
            .upsert(
              freshWindows.map(w => ({
                ...w,
                fetched_at: new Date().toISOString()
              })),
              { onConflict: 'spot_id,timestamp_utc' }
            );

          if (upsertError) {
            console.error('Error upserting forecasts:', upsertError);
          }
        }

        // Fetch the updated data
        const { data: updatedForecasts } = await supabase
          .from('forecast_snapshots')
          .select('*')
          .eq('spot_id', id)
          .gte('timestamp_utc', `${startDate}T00:00:00Z`)
          .lte('timestamp_utc', `${endDate}T23:59:59Z`)
          .order('timestamp_utc');

        forecasts = updatedForecasts || [];
      } catch (apiError) {
        console.error('Error fetching from Open-Meteo:', apiError);
        // Fall back to cached data if available
        forecasts = cachedForecasts || [];
      }
    }

    // Add scores if user is authenticated
    let windows = forecasts.map(forecast => ({
      ...forecast,
      score: undefined as number | undefined,
      explanation: undefined as string | undefined,
      is_recommended: undefined as boolean | undefined
    }));

    if (user) {
      // Get user's session count and model
      const { data: modelStats } = await supabase
        .from('user_model_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const numSessions = modelStats?.num_sessions || 0;
      const model = modelStats?.model_params as { coefficients: number[]; intercept: number } | null;

      // Score each window
      windows = forecasts.map(forecast => {
        const result = scoreWindow(forecast, user!, model, numSessions);
        return {
          ...forecast,
          score: result.score,
          explanation: result.explanation,
          is_recommended: result.isRecommended
        };
      });

      // Sort by score (highest first) for future windows
      const now = new Date().toISOString();
      const futureWindows = windows.filter(w => w.timestamp_utc >= now);
      const pastWindows = windows.filter(w => w.timestamp_utc < now);
      
      futureWindows.sort((a, b) => (b.score || 0) - (a.score || 0));
      pastWindows.sort((a, b) => 
        new Date(b.timestamp_utc).getTime() - new Date(a.timestamp_utc).getTime()
      );

      // Return with best upcoming first, then chronological past
      // Increased limit to 168 to ensure we have enough data for full 7-day forecast display
      windows = [...futureWindows.slice(0, 168), ...pastWindows.slice(0, 168)];
    }

    return res.json({
      spot,
      windows,
      cached: cacheIsFresh,
      date_range: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error('Error in GET /spots/:id/windows:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
