-- SwellMind Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: Supabase Auth creates auth.users automatically
-- This table extends it with app-specific preferences

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    home_region TEXT DEFAULT 'lisbon',
    ideal_wave_size_min DECIMAL(3,1) DEFAULT 1.0,  -- meters
    ideal_wave_size_max DECIMAL(3,1) DEFAULT 2.0,  -- meters
    crowd_tolerance INTEGER DEFAULT 5 CHECK (crowd_tolerance >= 1 AND crowd_tolerance <= 10),
    preferred_times_of_day JSONB DEFAULT '["morning"]'::jsonb,
    units_wave TEXT DEFAULT 'meters' CHECK (units_wave IN ('meters', 'feet')),
    units_wind TEXT DEFAULT 'kmh' CHECK (units_wind IN ('kmh', 'knots', 'mph')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPOTS TABLE
-- ============================================

CREATE TABLE public.spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    lat DECIMAL(9,6) NOT NULL,
    lng DECIMAL(9,6) NOT NULL,
    orientation_degrees INTEGER DEFAULT 270,  -- Direction beach faces (for wind calc)
    break_type TEXT DEFAULT 'beach' CHECK (break_type IN ('beach', 'point', 'reef')),
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    description TEXT,
    is_curated BOOLEAN DEFAULT true,  -- false for user-added spots
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER_SPOTS (Junction table for favorites)
-- ============================================

CREATE TABLE public.user_spots (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, spot_id)
);

-- ============================================
-- FORECAST_SNAPSHOTS (3-hour windows)
-- ============================================

CREATE TABLE public.forecast_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    wave_height DECIMAL(4,2),          -- meters
    wave_period DECIMAL(4,1),          -- seconds
    wave_direction INTEGER,            -- degrees (0-360)
    wind_speed DECIMAL(5,2),           -- m/s
    wind_direction INTEGER,            -- degrees (0-360)
    wind_orientation TEXT CHECK (wind_orientation IN ('offshore', 'cross-offshore', 'cross', 'cross-onshore', 'onshore')),
    data_source TEXT DEFAULT 'open-meteo',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique 3-hour windows per spot
    UNIQUE (spot_id, timestamp_utc)
);

-- Index for efficient querying
CREATE INDEX idx_forecast_spot_time ON public.forecast_snapshots(spot_id, timestamp_utc);
CREATE INDEX idx_forecast_time ON public.forecast_snapshots(timestamp_utc);

-- ============================================
-- SESSIONS (User surf session logs)
-- ============================================

CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    surf_timestamp_utc TIMESTAMPTZ NOT NULL,
    linked_forecast_id UUID REFERENCES public.forecast_snapshots(id) ON DELETE SET NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 10),
    perceived_wind TEXT CHECK (perceived_wind IN ('too_onshore', 'just_right', 'too_weak')),
    perceived_size INTEGER CHECK (perceived_size >= 1 AND perceived_size <= 10),
    perceived_crowd INTEGER CHECK (perceived_crowd >= 1 AND perceived_crowd <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_sessions_user ON public.sessions(user_id);
CREATE INDEX idx_sessions_user_time ON public.sessions(user_id, surf_timestamp_utc DESC);
CREATE INDEX idx_sessions_spot ON public.sessions(spot_id);

-- ============================================
-- FORECAST_USER_SCORES (ML predictions)
-- ============================================

CREATE TABLE public.forecast_user_scores (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    forecast_id UUID NOT NULL REFERENCES public.forecast_snapshots(id) ON DELETE CASCADE,
    predicted_score INTEGER NOT NULL CHECK (predicted_score >= 0 AND predicted_score <= 100),
    explanation TEXT,
    model_version TEXT DEFAULT 'v1',
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, forecast_id)
);

-- ============================================
-- USER_MODEL_STATS (Per-user ML state)
-- ============================================

CREATE TABLE public.user_model_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    num_sessions INTEGER DEFAULT 0,
    model_type TEXT DEFAULT 'generic' CHECK (model_type IN ('generic', 'blended', 'learned')),
    model_params JSONB,  -- Coefficients, etc.
    last_trained_at TIMESTAMPTZ,
    training_error DECIMAL(5,2),  -- MAE or similar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_stats ENABLE ROW LEVEL SECURITY;

-- Spots and forecasts are public (read-only for all)
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User spots
CREATE POLICY "Users can view own spots" ON public.user_spots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own spots" ON public.user_spots
    FOR ALL USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Scores
CREATE POLICY "Users can view own scores" ON public.forecast_user_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scores" ON public.forecast_user_scores
    FOR ALL USING (auth.uid() = user_id);

-- Model stats
CREATE POLICY "Users can view own model stats" ON public.user_model_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own model stats" ON public.user_model_stats
    FOR ALL USING (auth.uid() = user_id);

-- Everyone can read spots
CREATE POLICY "Anyone can view spots" ON public.spots
    FOR SELECT USING (true);

-- Everyone can read forecasts
CREATE POLICY "Anyone can view forecasts" ON public.forecast_snapshots
    FOR SELECT USING (true);

-- Service role can write forecasts (for backend)
CREATE POLICY "Service can insert forecasts" ON public.forecast_snapshots
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update forecasts" ON public.forecast_snapshots
    FOR UPDATE USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_model_stats_updated_at
    BEFORE UPDATE ON public.user_model_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
