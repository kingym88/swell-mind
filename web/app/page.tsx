'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import ForecastTimeline from '@/components/ForecastTimeline';
import { usePreferences } from '@/contexts/PreferencesContext';

export default function HomePage() {
  const router = useRouter();
  const { convertWaveHeight, convertWindSpeed, getWaveUnitLabel, getWindUnitLabel } = usePreferences();
  const [user, setUser] = useState<any>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [isAllSelected, setIsAllSelected] = useState(true); // Default to 'All'
  const [windows, setWindows] = useState<any[]>([]);
  const [allSpotsWindows, setAllSpotsWindows] = useState<Record<string, any[]>>({}); // Store windows for all spots
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [profileData, spotsData] = await Promise.all([
        api.getProfile(),
        api.getSpots()
      ]);
      
      setUser(profileData.user);
      setSpots(spotsData.spots);
      
      // Fetch insights for stats
      try {
        const insightsData = await api.getInsights();
        setInsights(insightsData);
      } catch {
        // Insights might not be available yet
        setInsights(null);
      }
      
      // Load windows for all spots
      if (spotsData.spots.length > 0) {
        const windowsData: Record<string, any[]> = {};
        await Promise.all(
          spotsData.spots.map(async (spot: any) => {
            try {
              const data = await api.getSpotWindows(spot.id);
              windowsData[spot.id] = data.windows;
            } catch (err) {
              console.error(`Failed to load windows for ${spot.name}:`, err);
              windowsData[spot.id] = [];
            }
          })
        );
        setAllSpotsWindows(windowsData);
        
        // Set initial windows to first spot's windows
        if (windowsData[spotsData.spots[0].id]) {
          setWindows(windowsData[spotsData.spots[0].id]);
        }
      }
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reload data when page becomes visible (e.g., after logging a session)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, loadData]);

  const loadSpotWindows = async (spot: any) => {
    setSelectedSpot(spot);
    setIsAllSelected(false);
    try {
      const data = await api.getSpotWindows(spot.id);
      setWindows(data.windows);
    } catch (err) {
      console.error('Failed to load windows:', err);
    }
  };

  const handleAllSelection = () => {
    setIsAllSelected(true);
    setSelectedSpot(null);
    // Windows will be calculated from allSpotsWindows in the render logic
  };

  const getScoreClass = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-lime-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-gray-400';
  };

  // Filter out night windows (only show 6AM to 9PM)
  const isDaytimeWindow = (timestamp: string) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    return hour >= 6 && hour < 21; // 6AM to 8:59PM
  };

  // Format time without :00 for whole hours (e.g., "9AM" instead of "9:00AM")
  const formatCompactTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    if (minutes === 0) {
      return `${hour12}${period}`;
    }
    return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Format date as "Mon, 27/01, 8AM-11AM"
  const formatCompactDateTime = (startDate: Date, endDate: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[startDate.getDay()];
    const date = startDate.getDate().toString().padStart(2, '0');
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const startTime = formatCompactTime(startDate);
    const endTime = formatCompactTime(endDate);
    
    return `${day}, ${date}/${month}, ${startTime}-${endTime}`;
  };

  // Format single date/time as "Mon, 27/01, 8AM"
  const formatCompactSingleDateTime = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[date.getDay()];
    const dateNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const time = formatCompactTime(date);
    
    return `${day}, ${dateNum}/${month}, ${time}`;
  };

  // Calculate windows based on selection mode
  let bestWindow: any = null;
  let upcomingWindows: any[] = [];

  if (isAllSelected) {
    // Combine all windows from all spots with spot information
    const allWindows: any[] = [];
    Object.entries(allSpotsWindows).forEach(([spotId, spotWindows]) => {
      const spot = spots.find(s => s.id === spotId);
      if (spot && spotWindows) {
        spotWindows.forEach(window => {
          allWindows.push({
            ...window,
            spot_id: spotId,
            spot_name: spot.name
          });
        });
      }
    });
    
    // Filter to daytime and sort by score
    const daytimeWindows = allWindows
      .filter(w => isDaytimeWindow(w.timestamp_utc))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    
    bestWindow = daytimeWindows[0];
    upcomingWindows = daytimeWindows.slice(1, 7);
  } else {
    // Single spot mode
    const daytimeWindows = windows.filter(w => isDaytimeWindow(w.timestamp_utc));
    bestWindow = daytimeWindows.find(w => w.score && w.score >= 50) || daytimeWindows[0];
    upcomingWindows = daytimeWindows.slice(1, 7);
    
    // Add spot info to windows in single spot mode too
    if (selectedSpot) {
      if (bestWindow) {
        bestWindow = { ...bestWindow, spot_name: selectedSpot.name };
      }
      upcomingWindows = upcomingWindows.map(w => ({ ...w, spot_name: selectedSpot.name }));
    }
  }

  if (loading && !user) {
    return (
      <div className="phone-frame">
        {/* Status Bar Skeleton */}
        <div className="status-bar">
          <div className="time">--:--</div>
          <div className="flex gap-1 text-xs">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex flex-col h-[calc(100%-108px)] overflow-hidden">
          {/* Header Skeleton */}
          <header className="bg-white p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          </header>

          {/* Scrollable Content Skeleton */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Hero Card Skeleton */}
            <div className="bg-gradient-to-br from-[var(--ocean-blue)] to-[var(--deep-blue)] rounded-2xl p-5 mb-4 min-h-[280px]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="h-3 w-32 bg-white/30 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-48 bg-white/30 rounded animate-pulse"></div>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/30 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="h-20 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-20 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-20 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 flex-1 bg-white/30 rounded-lg animate-pulse"></div>
                <div className="h-10 flex-1 bg-white/30 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Spot Selector Skeleton */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-28 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              ))}
            </div>

            {/* Stats Grid Skeleton */}
            <div className="mb-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-3 h-24 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Upcoming Windows Skeleton */}
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 w-36 flex-shrink-0 h-32 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Skeleton */}
        <nav className="bottom-nav">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="nav-item">
              <span className="nav-icon opacity-30">⚪</span>
              <span className="nav-label opacity-30">---</span>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="phone-frame">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="time">{format(currentTime, 'h:mm')}</div>
        <div className="flex gap-1 text-xs">
          <span>📶</span>
          <span>📡</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100%-108px)] overflow-hidden">
        {/* Header */}
        <header className="bg-white p-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold">
                Hey {user?.display_name || 'Surfer'} 🏄
              </h1>
              <p className="text-sm text-gray-600">Great conditions ahead!</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-[var(--foam-white)] flex items-center justify-center text-lg hover:bg-[var(--sky-blue)] transition-all">
                🔔
              </button>
              <button className="w-10 h-10 rounded-full bg-[var(--foam-white)] flex items-center justify-center text-lg hover:bg-[var(--sky-blue)] transition-all">
                ⚙️
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Hero Card - Best Window */}
          {bestWindow && (
            <div className="hero-card animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-90 mb-1">
                    NEXT BEST WINDOW
                  </p>
                  {bestWindow.spot_name && (
                    <p className="text-sm opacity-90 mb-2 flex items-center gap-1">
                      <span>📍</span>
                      <span>{bestWindow.spot_name}</span>
                    </p>
                  )}
                  <p className="text-base font-semibold">
                    🕐 {formatCompactDateTime(
                      new Date(bestWindow.timestamp_utc),
                      new Date(new Date(bestWindow.timestamp_utc).getTime() + 3 * 60 * 60 * 1000)
                    )}
                  </p>
                </div>
                <div className="score-badge large">
                  <span className="score-value">{bestWindow.score || '--'}</span>
                  <span className="score-max">/100</span>
                </div>
              </div>

              <div className="conditions-grid">
                <div className="condition">
                  <div className="condition-icon">🌊</div>
                  <div className="condition-value">
                    {bestWindow.wave_height ? `${convertWaveHeight(bestWindow.wave_height).toFixed(1)}${getWaveUnitLabel()}` : '--'} @ {bestWindow.wave_period?.toFixed(0) || '--'}s
                  </div>
                  <div className="condition-label">WNW Swell</div>
                </div>
                <div className="condition">
                  <div className="condition-icon">💨</div>
                  <div className="condition-value capitalize">{bestWindow.wind_orientation || 'N/A'}</div>
                  <div className="condition-label">
                    {bestWindow.wind_speed ? `${convertWindSpeed(bestWindow.wind_speed * 3.6).toFixed(0)} ${getWindUnitLabel()}` : 'N/A'}
                  </div>
                </div>
                <div className="condition">
                  <div className="condition-icon">🌅</div>
                  <div className="condition-value">Rising</div>
                  <div className="condition-label">Mid tide</div>
                </div>
              </div>

              {bestWindow.explanation && (
                <div className="flex items-start gap-2 p-3 bg-white/15 rounded-lg mb-3">
                  <span className="text-base">✨</span>
                  <p className="text-xs leading-relaxed">{bestWindow.explanation}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn-primary-hero flex-1">
                  Set Reminder
                </button>
                <Link href="/log" className="btn-secondary-hero flex-1 text-center">
                  Log Session
                </Link>
              </div>
            </div>
          )}

          {/* Spot Selector - NOW BELOW HERO CARD */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {/* All button */}
            <button
              onClick={handleAllSelection}
              className={`spot-pill ${isAllSelected ? 'active' : ''}`}
            >
              <span>🌊</span>
              All
            </button>
            
            {/* Individual spot buttons */}
            {spots.slice(0, 5).map((spot) => (
              <button
                key={spot.id}
                onClick={() => loadSpotWindows(spot)}
                className={`spot-pill ${!isAllSelected && selectedSpot?.id === spot.id ? 'active' : ''}`}
              >
                <span>📍</span>
                {spot.name}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-3">{user ? 'Your Stats' : 'Quick Stats'}</h2>
            <div className="stats-grid">
              <div className="stat-card dark">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{insights?.stats?.total_sessions || 4}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat-card dark">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{insights?.stats?.avg_rating?.toFixed(1) || '8.0'}</div>
                <div className="stat-label">Avg Rating</div>
              </div>
              <div className="stat-card dark">
                <div className="stat-icon">📍</div>
                <div className="stat-value text-base">{insights?.best_spot?.name || 'Ericeira'}</div>
                <div className="stat-label">Best Spot</div>
              </div>
              <div className="stat-card dark">
                <div className="stat-icon">🤖</div>
                <div className="stat-value text-base">
                  {insights?.model_stats?.confidence_level || 'High'}
                </div>
                <div className="stat-label">Model Confidence</div>
              </div>
            </div>
          </div>

          {/* Upcoming Windows */}
          <div>
            <h2 className="text-lg font-bold mb-3">Upcoming Windows</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {upcomingWindows.map((window, idx) => (
                <div key={idx} className={`window-card ${window.is_recommended ? 'recommended' : ''}`}>
                  {window.is_recommended && (
                    <span className="inline-block bg-gradient-to-r from-[var(--sunset-orange)] to-[var(--score-moderate)] text-white px-2 py-0.5 rounded-full text-xs font-semibold mb-2">
                      🏄 Recommended
                    </span>
                  )}
                  <div className={`text-3xl font-bold mb-1 ${getScoreClass(window.score)}`}>
                    {window.score || '--'}
                  </div>
                  {window.spot_name && isAllSelected && (
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <span>📍</span>
                      <span>{window.spot_name}</span>
                    </div>
                  )}
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatCompactSingleDateTime(new Date(window.timestamp_utc))}
                  </div>
                  <div className="text-xs text-gray-600">
                    {window.wave_height ? `${convertWaveHeight(window.wave_height).toFixed(1)}${getWaveUnitLabel()}` : '--'} @ {window.wave_period?.toFixed(0)}s
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {window.wind_orientation || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Day Forecast Timeline */}
          <ForecastTimeline />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
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
        <Link href="/spots" className="nav-item">
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
