'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import ForecastTimeline from '@/components/ForecastTimeline';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { convertWaveHeight, convertWindSpeed, getWaveUnitLabel, getWindUnitLabel } = usePreferences();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | 'all'>('all');
  const [windows, setWindows] = useState<any[]>([]);
  const [allWindows, setAllWindows] = useState<Map<string, any[]>>(new Map());
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const [spotsData] = await Promise.all([
          api.getSpots()
        ]);
        
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
          const windowsMap = new Map();
          await Promise.all(
            spotsData.spots.map(async (spot: any) => {
              try {
                const data = await api.getSpotWindows(spot.id);
                windowsMap.set(spot.id, data.windows);
              } catch (err) {
                console.error(`Failed to load windows for ${spot.name}:`, err);
              }
            })
          );
          setAllWindows(windowsMap);
          
          // Set initial selection to "All"
          setSelectedSpotId('all');
          updateWindowsForSelection('all', spotsData.spots, windowsMap);
        }
      } else {
        // Load generic spots for logged-out users
        const spotsData = await api.getSpots();
        const featuredSpots = spotsData.spots.slice(0, 4);
        setSpots(featuredSpots);
        
        // Load sample windows for featured spots
        if (featuredSpots.length > 0) {
          const windowsMap = new Map();
          await Promise.all(
            featuredSpots.map(async (spot: any) => {
              try {
                const data = await api.getSpotWindows(spot.id);
                windowsMap.set(spot.id, data.windows);
              } catch (err) {
                console.error(`Failed to load windows for ${spot.name}:`, err);
              }
            })
          );
          setAllWindows(windowsMap);
          setSelectedSpotId('all');
          updateWindowsForSelection('all', featuredSpots, windowsMap);
        }
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateWindowsForSelection = (spotId: string | 'all', spotsList: any[], windowsMap: Map<string, any[]>) => {
    if (spotId === 'all') {
      // Combine all windows from all spots
      const combined: any[] = [];
      spotsList.forEach((spot) => {
        const spotWindows = windowsMap.get(spot.id) || [];
        spotWindows.forEach((window) => {
          combined.push({
            ...window,
            spot_name: spot.name,
            spot_id: spot.id
          });
        });
      });
      // Sort by score descending
      combined.sort((a, b) => (b.score || 0) - (a.score || 0));
      setWindows(combined);
      setSelectedSpot(null);
    } else {
      const spot = spotsList.find(s => s.id === spotId);
      setSelectedSpot(spot);
      const spotWindows = windowsMap.get(spotId) || [];
      setWindows(spotWindows.map(w => ({ ...w, spot_name: spot?.name, spot_id: spotId })));
    }
  };

  const handleSpotSelection = (spotId: string | 'all') => {
    setSelectedSpotId(spotId);
    updateWindowsForSelection(spotId, spots, allWindows);
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

  // Filter windows to only daytime (6AM-9PM)
  const daytimeWindows = windows.filter(w => isDaytimeWindow(w.timestamp_utc));
  
  const bestWindow = daytimeWindows.find(w => w.score && w.score >= 50) || daytimeWindows[0];
  const upcomingWindows = daytimeWindows.slice(1, 7);

  // Show skeleton loading only on initial auth check
  if (authLoading || (loading && !user && isAuthenticated)) {
    return (
      <div className="phone-frame flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🌊</div>
          <p className="text-gray-600">Loading...</p>
        </div>
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
              <p className="text-sm text-gray-600">
                {isAuthenticated ? 'Great conditions ahead!' : 'Sign in for personalized forecasts'}
              </p>
            </div>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => setSearchOpen(true)}
                    className="w-10 h-10 rounded-full bg-[var(--foam-white)] flex items-center justify-center text-lg hover:bg-[var(--sky-blue)] transition-all"
                  >
                    🔍
                  </button>
                  <Link href="/settings">
                    <button className="w-10 h-10 rounded-full bg-[var(--foam-white)] flex items-center justify-center text-lg hover:bg-[var(--sky-blue)] transition-all">
                      ⚙️
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/login">
                  <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--ocean-blue)] to-[var(--deep-ocean)] text-white font-semibold hover:opacity-90 transition-all">
                    Log In
                  </button>
                </Link>
              )}
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
                  {/* Location Display */}
                  {bestWindow.spot_name && (
                    <p className="text-sm opacity-80 mb-2 flex items-center gap-1">
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
                {isAuthenticated ? (
                  <>
                    <Link href="/best-windows" className="btn-primary-hero flex-1 text-center">
                      Best Windows
                    </Link>
                    <Link href="/log" className="btn-secondary-hero flex-1 text-center">
                      Log Session
                    </Link>
                  </>
                ) : (
                  <Link href="/signup" className="btn-primary-hero flex-1 text-center">
                    Sign Up to Track Sessions
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Spot Selector - NOW BELOW HERO CARD */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {/* All button */}
            <button
              onClick={() => handleSpotSelection('all')}
              className={`spot-pill ${selectedSpotId === 'all' ? 'active' : ''}`}
            >
              <span>🌐</span>
              All
            </button>
            {spots.slice(0, 5).map((spot) => (
              <button
                key={spot.id}
                onClick={() => handleSpotSelection(spot.id)}
                className={`spot-pill ${selectedSpotId === spot.id ? 'active' : ''}`}
              >
                <span>📍</span>
                {spot.name}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-3">
              {isAuthenticated ? 'Your Stats' : 'Quick Stats'}
            </h2>
            {isAuthenticated ? (
              <div className="stats-grid">
                <div className="stat-card dark">
                  <div className="stat-icon">📊</div>
                  <div className="stat-value">{insights?.stats?.total_sessions || 0}</div>
                  <div className="stat-label">Sessions</div>
                </div>
                <div className="stat-card dark">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{insights?.stats?.avg_rating?.toFixed(1) || '--'}</div>
                  <div className="stat-label">Avg Rating</div>
                </div>
                <div className="stat-card dark">
                  <div className="stat-icon">📍</div>
                  <div className="stat-value text-base">{insights?.best_spot?.name || '--'}</div>
                  <div className="stat-label">Best Spot</div>
                </div>
                <div className="stat-card dark">
                  <div className="stat-icon">🤖</div>
                  <div className="stat-value text-base">
                    {insights?.model_stats?.confidence_level || 'Learning'}
                  </div>
                  <div className="stat-label">Model Confidence</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[var(--ocean-blue)] to-[var(--deep-ocean)] rounded-2xl p-6 text-white text-center">
                <div className="text-4xl mb-3">🏄‍♂️</div>
                <h3 className="text-lg font-bold mb-2">Join SwellMind</h3>
                <p className="text-sm opacity-90 mb-4">
                  Track your sessions, get personalized forecasts, and find the best surf windows
                </p>
                <Link href="/signup" className="inline-block px-6 py-2 bg-white text-[var(--ocean-blue)] rounded-full font-semibold hover:bg-gray-100 transition-all">
                  Sign Up Free
                </Link>
              </div>
            )}
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
                  {/* Show location when "All" is selected */}
                  {selectedSpotId === 'all' && window.spot_name && (
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <span>📍</span>
                      <span>{window.spot_name}</span>
                    </div>
                  )}
                  <div className={`text-3xl font-bold mb-1 ${getScoreClass(window.score)}`}>
                    {window.score || '--'}
                  </div>
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
          {isAuthenticated && <ForecastTimeline />}
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

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">Search Surf Spots</h3>
              <button 
                onClick={() => setSearchOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search for a surf spot..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--ocean-blue)]"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 text-center">
                Search functionality coming soon! 🏄
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
