'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { usePreferences } from '@/contexts/PreferencesContext';

interface ForecastWindow {
  timestamp_utc: string;
  wave_height: number;
  score?: number;
}

interface SpotForecastSummary {
  spotId: string;
  spotName: string;
  dailySummaries: {
    date: string;
    dayName: string;
    minWave: number;
    maxWave: number;
    avgScore: number;
  }[];
}

export default function ForecastTimeline() {
  const router = useRouter();
  const { convertWaveHeight, getWaveUnitLabel } = usePreferences();
  const [summaries, setSummaries] = useState<SpotForecastSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    try {
      // Fetch public spots and user favorites
      const spotsRes = await api.getSpots();
      let spotsToDisplay: { id: string; name: string }[] = [];
      
      try {
        const profileRes = await api.getProfile();
        if (profileRes.favorite_spots && profileRes.favorite_spots.length > 0) {
          // User is logged in and has favorites - show all 15 spots
          const favorites = profileRes.favorite_spots as { id: string; name: string }[];
          const favoriteIds = new Set(favorites.map((s) => s.id));
          
          // Get public spots that are not in favorites
          const nonFavoritePublic = spotsRes.spots.filter((s: { id: string; name: string }) => !favoriteIds.has(s.id));
          
          // Combine favorites + remaining public spots to reach 15 total
          const remainingSlots = Math.max(0, 15 - favorites.length);
          spotsToDisplay = [...favorites, ...nonFavoritePublic.slice(0, remainingSlots)];
        } else {
          // Logged in but no favorites - show 15 public spots
          spotsToDisplay = spotsRes.spots.slice(0, 15);
        }
      } catch {
        // Not logged in - show only 5 public spots
        spotsToDisplay = spotsRes.spots.slice(0, 5);
      }
      
      // Ensure we have at most 15 spots
      spotsToDisplay = spotsToDisplay.slice(0, 15);

      // Fetch forecasts for each spot
      const summariesData: SpotForecastSummary[] = [];

      for (const spot of spotsToDisplay) {
        const forecastRes = await api.getSpotForecast(spot.id);
        const windows = forecastRes.windows;

        // Group by day using calendar date strings to avoid time-of-day filtering issues
        const dailyMap = new Map<string, ForecastWindow[]>();
        
        windows.forEach((window: ForecastWindow) => {
          // Extract YYYY-MM-DD from the ISO string
          const dateKey = window.timestamp_utc.split('T')[0];
          if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, []);
          }
          dailyMap.get(dateKey)!.push(window);
        });

        // Get today's date in YYYY-MM-DD format for filtering
        const todayKey = new Date().toISOString().split('T')[0];

        // Calculate daily summaries
        const dailySummaries = Array.from(dailyMap.entries())
          .filter(([date]) => date >= todayKey) // Filter out past dates
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, 6)
          .map(([date, windows]) => {
            const waveHeights = windows.map(w => w.wave_height);
            const scores = windows.map(w => w.score || 50);
            const windowDate = new Date(date);
            
            return {
              date,
              dayName: windowDate.toLocaleDateString('en-US', { weekday: 'short' }),
              minWave: Math.min(...waveHeights),
              maxWave: Math.max(...waveHeights),
              avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
            };
          });

        summariesData.push({
          spotId: spot.id,
          spotName: spot.name,
          dailySummaries,
        });
      }

      setSummaries(summariesData);
    } catch (error) {
      console.error('Failed to fetch timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // orange
    if (score >= 40) return '#ec4899'; // pink
    return '#eab308'; // yellow
  };

  const handleCellClick = (spotId: string) => {
    router.push(`/spots/${spotId}`);
  };

  // Refs for scroll synchronization
  const fixedColumnRef = useRef<HTMLDivElement>(null);  // Date headers (top-right)
  const scrollableRef = useRef<HTMLDivElement>(null);   // Spot names (bottom-left)

  if (loading) {
    return (
      <div className="forecast-timeline-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Get all unique dates from first spot
  const dates = summaries[0]?.dailySummaries || [];

  return (
    <div 
      className="forecast-timeline"
      style={{
        margin: '2rem 0',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        borderRadius: '20px',
      }}
    >
      <h2 
        className="timeline-title"
        style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: 'white',
          marginBottom: '1rem',
        }}
      >
        6-Day Forecast
      </h2>
      
      {/* 4-Quadrant Freeze Panes Layout (like Excel) */}
      <div 
        className="timeline-container"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '0.5rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'grid',
          gridTemplateColumns: '130px 1fr',
          gridTemplateRows: '52px 1fr',
          maxHeight: '360px',
          overflow: 'hidden',
        }}
      >
        {/* TOP-LEFT: Fixed "SPOT" header (never scrolls) */}
        <div 
          style={{ 
            padding: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#006494',
            borderRadius: '8px',
            margin: '2px',
          }}
        >
          Spot
        </div>

        {/* TOP-RIGHT: Date headers (scroll horizontally only) */}
        <div 
          ref={fixedColumnRef}
          className="timeline-date-headers"
          style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'hidden',
            overflowY: 'hidden',
            padding: '2px 2px 2px 0',
          }}
        >
          {dates.map((day) => (
            <div 
              key={day.date} 
              style={{ 
                minWidth: '70px',
                flex: '0 0 70px',
                textAlign: 'center',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>{day.dayName}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{day.date.split('-')[2]}</div>
            </div>
          ))}
        </div>

        {/* BOTTOM-LEFT: Spot names (scroll vertically only) */}
        <div 
          ref={scrollableRef}
          className="timeline-spot-names"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'hidden',
            overflowX: 'hidden',
            padding: '0 2px 2px 2px',
          }}
        >
          {summaries.map((summary) => (
            <div 
              key={`fixed-${summary.spotId}`}
              style={{ 
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#006494',
                borderRadius: '8px',
                minHeight: '48px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {summary.spotName}
            </div>
          ))}
        </div>

        {/* BOTTOM-RIGHT: Data cells (scroll both ways) - THIS IS THE MAIN SCROLLABLE AREA */}
        <div 
          className="timeline-data-grid"
          onScroll={(e) => {
            const target = e.currentTarget;
            // Sync horizontal scroll to date headers (top-right)
            if (fixedColumnRef.current) {
              fixedColumnRef.current.scrollLeft = target.scrollLeft;
            }
            // Sync vertical scroll to spot names (bottom-left)
            if (scrollableRef.current) {
              scrollableRef.current.scrollTop = target.scrollTop;
            }
          }}
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '0 2px 2px 0',
          }}
        >
          {summaries.map((summary) => (
            <div 
              key={`scroll-${summary.spotId}`}
              style={{
                display: 'flex',
                gap: '4px',
                minHeight: '48px',
              }}
            >
              {summary.dailySummaries.map((day) => (
                <div
                  key={`${summary.spotId}-${day.date}`}
                  onClick={() => handleCellClick(summary.spotId)}
                  style={{
                    minWidth: '70px',
                    flex: '0 0 70px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', textAlign: 'center' }}>
                    {Math.round(convertWaveHeight(day.minWave))}-{Math.round(convertWaveHeight(day.maxWave))}{getWaveUnitLabel()}
                    {convertWaveHeight(day.maxWave) >= 8 ? '+' : ''}
                  </div>
                  <div
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: getScoreColor(day.avgScore),
                      boxShadow: `0 0 8px ${getScoreColor(day.avgScore)}`,
                    }}
                  ></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
