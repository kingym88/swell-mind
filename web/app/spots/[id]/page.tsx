'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface ForecastWindow {
  timestamp_utc: string;
  wave_height: number;
  wave_period: number;
  wave_direction: number;
  wind_speed: number;
  wind_direction: number;
  wind_orientation: string;
  score?: number;
}

interface Spot {
  id: string;
  name: string;
  location: string;
  region: string;
  orientation_degrees: number;
}

export default function SpotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const spotId = params?.id as string;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [windows, setWindows] = useState<ForecastWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    if (spotId) {
      loadSpotData();
    }
  }, [spotId]);

  const loadSpotData = async () => {
    try {
      const data = await api.getSpotWindows(spotId);
      setSpot(data.spot);
      setWindows(data.windows);
    } catch (error) {
      console.error('Failed to load spot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score?: number): string => {
    if (!score) return 'rgba(255, 255, 255, 0.3)';
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#ec4899';
    return '#eab308';
  };

  const getScoreLabel = (score?: number): string => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // Group windows by day
  const groupedWindows = windows.reduce((acc, window) => {
    const date = new Date(window.timestamp_utc);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(window);
    return acc;
  }, {} as Record<string, ForecastWindow[]>);

  const todayKey = new Date().toISOString().split('T')[0];
  const days = Object.keys(groupedWindows)
    .filter(day => day >= todayKey)
    .sort()
    .slice(0, 7);
  const currentDayWindows = days[selectedDay] ? groupedWindows[days[selectedDay]] : [];

  if (loading) {
    return (
      <div className="phone-frame flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-white mt-4">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="phone-frame flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Spot not found</p>
          <Link href="/spots" className="btn-primary-hero mt-4 inline-block">
            Back to Spots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-frame">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="time">{format(new Date(), 'h:mm')}</div>
        <div className="flex gap-1 text-xs">
          <span>📶</span>
          <span>📡</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100%-108px)] overflow-hidden bg-gradient-to-br from-[var(--deep-ocean)] to-[var(--surf-blue)]">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md p-4 border-b border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
            >
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{spot.name}</h1>
              <p className="text-sm text-white/80">📍 {spot.location}</p>
            </div>
          </div>
        </header>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white/5">
          {days.map((day, idx) => {
            const date = new Date(day);
            const isSelected = idx === selectedDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-[var(--surf-blue)]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="text-xs uppercase">{format(date, 'EEE')}</div>
                <div className="text-lg">{format(date, 'd')}</div>
              </button>
            );
          })}
        </div>

        {/* Forecast Windows */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {currentDayWindows.map((window, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
              >
                {/* Time and Score */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-bold text-lg">
                      {format(new Date(window.timestamp_utc), 'h:mm a')} -{' '}
                      {format(
                        new Date(new Date(window.timestamp_utc).getTime() + 3 * 60 * 60 * 1000),
                        'h:mm a'
                      )}
                    </div>
                    <div
                      className="text-sm font-semibold mt-1"
                      style={{ color: getScoreColor(window.score) }}
                    >
                      {getScoreLabel(window.score)}
                    </div>
                  </div>
                  <div
                    className="score-badge large"
                    style={{
                      background: `linear-gradient(135deg, ${getScoreColor(window.score)}, ${getScoreColor(window.score)}dd)`,
                    }}
                  >
                    <span className="score-value">{window.score || '--'}</span>
                    <span className="score-max">/100</span>
                  </div>
                </div>

                {/* Conditions Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl mb-1">🌊</div>
                    <div className="text-white font-bold">
                      {window.wave_height?.toFixed(1)}m
                    </div>
                    <div className="text-white/60 text-xs">
                      @ {window.wave_period?.toFixed(0)}s
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl mb-1">💨</div>
                    <div className="text-white font-bold capitalize">
                      {window.wind_orientation || 'N/A'}
                    </div>
                    <div className="text-white/60 text-xs">
                      {window.wind_speed ? `${(window.wind_speed * 3.6).toFixed(0)} km/h` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl mb-1">🧭</div>
                    <div className="text-white font-bold">
                      {window.wave_direction?.toFixed(0)}°
                    </div>
                    <div className="text-white/60 text-xs">Swell Dir</div>
                  </div>
                </div>
              </div>
            ))}

            {currentDayWindows.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🌊</div>
                <p className="text-white/60">No forecast data available for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link href="/sessions" className="nav-item">
          <span className="nav-icon">📊</span>
          <span className="nav-label">Sessions</span>
        </Link>
        <Link href="/log" className="nav-item fab">
          <span className="nav-icon">➕</span>
        </Link>
        <Link href="/spots" className="nav-item active">
          <span className="nav-icon">📍</span>
          <span className="nav-label">Spots</span>
        </Link>
        <Link href="/settings" className="nav-item">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
