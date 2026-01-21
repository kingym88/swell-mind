/**
 * Sessions API Routes
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { trainUserModel, calculateUserInsights } from '../ml/scoring.js';
import type { Session, ForecastSnapshot } from '../types/index.js';

const router = Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for session creation
const createSessionSchema = z.object({
  spot_id: z.string().uuid(),
  surf_timestamp_utc: z.string().datetime(),
  overall_rating: z.number().int().min(1).max(10),
  perceived_wind: z.enum(['too_onshore', 'just_right', 'too_weak']).optional(),
  perceived_size: z.number().int().min(1).max(10).optional(),
  perceived_crowd: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional()
});

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

  // Attach user to request
  (req as any).userId = user.id;
  next();
}

/**
 * Find the nearest forecast snapshot within ±90 minutes
 */
async function findNearestForecast(
  spotId: string, 
  timestamp: string
): Promise<ForecastSnapshot | null> {
  const targetTime = new Date(timestamp);
  const minTime = new Date(targetTime.getTime() - 90 * 60 * 1000);
  const maxTime = new Date(targetTime.getTime() + 90 * 60 * 1000);

  const { data: forecasts } = await supabase
    .from('forecast_snapshots')
    .select('*')
    .eq('spot_id', spotId)
    .gte('timestamp_utc', minTime.toISOString())
    .lte('timestamp_utc', maxTime.toISOString())
    .order('timestamp_utc');

  if (!forecasts || forecasts.length === 0) return null;

  // Find the closest one
  let closest = forecasts[0];
  let minDiff = Math.abs(new Date(closest.timestamp_utc).getTime() - targetTime.getTime());

  for (const forecast of forecasts) {
    const diff = Math.abs(new Date(forecast.timestamp_utc).getTime() - targetTime.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = forecast;
    }
  }

  return closest;
}

/**
 * Update user's ML model after new sessions
 */
async function updateUserModel(userId: string) {
  // Fetch all user sessions with linked forecasts
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      forecast:forecast_snapshots(*)
    `)
    .eq('user_id', userId)
    .not('linked_forecast_id', 'is', null)
    .order('created_at', { ascending: false });

  if (!sessions || sessions.length < 3) {
    // Not enough data to train
    await supabase
      .from('user_model_stats')
      .upsert({
        user_id: userId,
        num_sessions: sessions?.length || 0,
        model_type: 'generic',
        model_params: null,
        updated_at: new Date().toISOString()
      });
    return;
  }

  // Prepare training data
  const trainingData = sessions
    .filter(s => s.forecast)
    .map(s => ({
      forecast: s.forecast as ForecastSnapshot,
      rating: s.overall_rating
    }));

  // Train model
  const model = trainUserModel(trainingData);

  // Determine model type
  let modelType: 'generic' | 'blended' | 'learned';
  if (sessions.length < 3) modelType = 'generic';
  else if (sessions.length < 10) modelType = 'blended';
  else modelType = 'learned';

  // Save model stats
  await supabase
    .from('user_model_stats')
    .upsert({
      user_id: userId,
      num_sessions: sessions.length,
      model_type: modelType,
      model_params: model,
      last_trained_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
}

/**
 * POST /sessions
 * Log a new surf session
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // Validate input
    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.issues 
      });
    }

    const data = parseResult.data;

    // Check for duplicate session (same spot + time within 30 min)
    const targetTime = new Date(data.surf_timestamp_utc);
    const minTime = new Date(targetTime.getTime() - 30 * 60 * 1000);
    const maxTime = new Date(targetTime.getTime() + 30 * 60 * 1000);

    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('spot_id', data.spot_id)
      .gte('surf_timestamp_utc', minTime.toISOString())
      .lte('surf_timestamp_utc', maxTime.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate session', 
        message: 'You already logged a session at this spot around this time',
        existing_id: existing[0].id
      });
    }

    // Find nearest forecast
    const nearestForecast = await findNearestForecast(data.spot_id, data.surf_timestamp_utc);

    // Create session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        spot_id: data.spot_id,
        surf_timestamp_utc: data.surf_timestamp_utc,
        linked_forecast_id: nearestForecast?.id || null,
        overall_rating: data.overall_rating,
        perceived_wind: data.perceived_wind,
        perceived_size: data.perceived_size,
        perceived_crowd: data.perceived_crowd,
        notes: data.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Update user's ML model (async, don't wait)
    updateUserModel(userId).catch(err => 
      console.error('Error updating user model:', err)
    );

    return res.status(201).json({
      session,
      linked_forecast: nearestForecast,
      message: nearestForecast 
        ? 'Session logged and linked to forecast conditions'
        : 'Session logged (no forecast data available for this time)'
    });
  } catch (error) {
    console.error('Error in POST /sessions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /sessions/me
 * Get current user's sessions
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 20, offset = 0 } = req.query;

    const { data: sessions, error, count } = await supabase
      .from('sessions')
      .select(`
        *,
        spot:spots(*),
        forecast:forecast_snapshots(*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('surf_timestamp_utc', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.json({
      sessions,
      total: count,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error in GET /sessions/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /sessions/:id
 * Update a session
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate update data
    const updateSchema = createSessionSchema.partial();
    const parseResult = updateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.issues 
      });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .update(parseResult.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }

    // Re-train model if rating changed significantly
    updateUserModel(userId).catch(err => 
      console.error('Error updating user model:', err)
    );

    return res.json({ session });
  } catch (error) {
    console.error('Error in PUT /sessions/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /sessions/:id
 * Delete a session
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ error: 'Failed to delete session' });
    }

    // Update model after deletion
    updateUserModel(userId).catch(err => 
      console.error('Error updating user model:', err)
    );

    return res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Error in DELETE /sessions/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
