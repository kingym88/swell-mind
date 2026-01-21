/**
 * Auth API Routes
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1).max(50).optional()
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  home_region: z.string().optional(),
  ideal_wave_size_min: z.number().min(0).max(10).optional(),
  ideal_wave_size_max: z.number().min(0).max(10).optional(),
  crowd_tolerance: z.number().int().min(1).max(10).optional(),
  preferred_times_of_day: z.array(z.string()).optional(),
  units_wave: z.enum(['meters', 'feet']).optional(),
  units_wind: z.enum(['kmh', 'knots', 'mph']).optional()
});

/**
 * POST /auth/signup
 * Create a new account
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parseResult = signUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.issues 
      });
    }

    const { email, password, display_name } = parseResult.data;

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Update display name if provided
    if (display_name) {
      await supabase
        .from('users')
        .update({ display_name })
        .eq('id', data.user.id);
    }

    return res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name
      },
      session: data.session,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Error in POST /auth/signup:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/signin
 * Sign in with email/password
 */
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const parseResult = signInSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.issues 
      });
    }

    const { email, password } = parseResult.data;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Signin error:', error);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.json({
      user: profile,
      session: data.session
    });
  } catch (error) {
    console.error('Error in POST /auth/signin:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/signout
 * Sign out current session
 */
router.post('/signout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      // Even if no token, return success since frontend will clear localStorage
      return res.json({ message: 'Signed out successfully' });
    }

    const token = authHeader.slice(7);
    
    // Verify the token is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // Even if token is invalid or signout fails, return success
    // The frontend will clear localStorage regardless
    if (!authError && user) {
      // Optionally invalidate the session on Supabase side
      // Note: This requires admin privileges or different approach
      await supabase.auth.admin.signOut(token).catch(() => {
        // Ignore errors - frontend will clear token anyway
      });
    }

    return res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error in POST /auth/signout:', error);
    // Still return success - signout should always succeed on frontend
    return res.json({ message: 'Signed out successfully' });
  }
});

/**
 * GET /auth/me
 * Get current user's profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch user's favorite spots
    const { data: favoriteSpots } = await supabase
      .from('user_spots')
      .select(`
        display_order,
        spot:spots(*)
      `)
      .eq('user_id', user.id)
      .order('display_order');

    // Fetch model stats
    const { data: modelStats } = await supabase
      .from('user_model_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return res.json({
      user: profile,
      favorite_spots: favoriteSpots?.map(fs => fs.spot) || [],
      model_stats: modelStats
    });
  } catch (error) {
    console.error('Error in GET /auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /auth/me
 * Update current user's profile
 */
router.put('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: parseResult.error.issues 
      });
    }

    const { data: profile, error } = await supabase
      .from('users')
      .update(parseResult.data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.json({ user: profile });
  } catch (error) {
    console.error('Error in PUT /auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /auth/me
 * Delete current user's account
 */
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Delete user data (cascade will handle related records)
    // The trigger and RLS should handle most cleanup

    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/me/spots
 * Add a favorite spot
 */
router.post('/me/spots', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { spot_id } = req.body;

    if (!spot_id) {
      return res.status(400).json({ error: 'spot_id is required' });
    }

    // Get current max order
    const { data: existing } = await supabase
      .from('user_spots')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

    const { error } = await supabase
      .from('user_spots')
      .upsert({
        user_id: user.id,
        spot_id,
        display_order: nextOrder
      });

    if (error) {
      console.error('Error adding favorite spot:', error);
      return res.status(500).json({ error: 'Failed to add spot' });
    }

    return res.status(201).json({ message: 'Spot added to favorites' });
  } catch (error) {
    console.error('Error in POST /auth/me/spots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /auth/me/spots/:spotId
 * Remove a favorite spot
 */
router.delete('/me/spots/:spotId', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { spotId } = req.params;

    const { error } = await supabase
      .from('user_spots')
      .delete()
      .eq('user_id', user.id)
      .eq('spot_id', spotId);

    if (error) {
      console.error('Error removing favorite spot:', error);
      return res.status(500).json({ error: 'Failed to remove spot' });
    }

    return res.json({ message: 'Spot removed from favorites' });
  } catch (error) {
    console.error('Error in DELETE /auth/me/spots/:spotId:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
