'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAuth } from '@/contexts/AuthContext';

export default function BestWindowsPage() {
  const router = useRouter();
  const { convertWaveHeight, convertWindSpeed, getWaveUnitLabel, getWindUnitLabel } = usePreferences();
  const { isAuthenticated } = useAuth();
  
  const [spotWindows, setSpotWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadBestWindows();
  }, [isAuthenticated]);

  const loadBestWindows = async () => {
    try {
      const spotsData = await api.getSpots();
      const spots = spotsData.spots;
      
      // Load windows for each spot and find the best one
      const windowsPromises = spots.map(async (spot: any) => {
        try {
          const data = await api.getSpotWindows(spot.id);
          const daytimeWindows = data.windows.filter((w: any) => {
            const date = new Date(w.timestamp_utc);
            const hour = date.getHours();
            return hour >= 6 && hour < 21;
          });
          
          // Find best window for this spot
          const bestWindow = daytimeWindows.find((w: any) => w.score && w.score >= 50) || daytimeWindows[0];
          
          return {
            spot,
            window: bestWindow,
            score: bestWindow?.score || 0
          };
        } catch (err) {
          console.error(`Failed to load windows for ${spot.name}:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(windowsPromises);
      const validResults = results.filter((r): r is { spot: any; window: any; score: number } => r !== null && r.window);
      
      // Sort by score descending
      validResults.sort((a, b) => (b?.score || 0) - (a?.score || 0));
      
      setSpotWindows(validResults);
    } catch (err) {
      console.error('Failed to load best windows:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCompactDateTime = (startDate: Date, endDate: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[startDate.getDay()];
    const date = startDate.getDate().toString().padStart(2, '0');
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const startTime = formatCompactTime(startDate);
    const endTime = formatCompactTime(endDate);
    
    return `${day}, ${date}/${month}, ${startTime}-${endTime}`;
  };

  const getScoreClass = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-400';
    if (score >= 85) return 'bg-green-100 text-green-600';
    if (score >= 70) return 'bg-lime-100 text-lime-600';
    if (score >= 50) return 'bg-yellow-100 text-yellow-600';
    if (score >= 30) return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-400';
  };

  if (loading) {
    return (
      <div className="phone-frame flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🌊</div>
          <p className="text-gray-600">Loading best windows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-frame">
      {/* Header */}
      <header className="bg-white p-4 border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
              ←
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Best Windows</h1>
            <p className="text-sm text-gray-600">Next best surf for all your spots</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 pb-24">
        {spotWindows.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏄</div>
            <p className="text-gray-600">No surf windows available</p>
            <p className="text-sm text-gray-500 mt-2">Add some favorite spots to see forecasts</p>
          </div>
        ) : (
          spotWindows.map(({ spot, window, score }, idx) => (
            <div key={spot.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {/* Spot Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <h3 className="font-bold text-lg">{spot.name}</h3>
                  </div>
                  {window && (
                    <p className="text-sm text-gray-600">
                      🕐 {formatCompactDateTime(
                        new Date(window.timestamp_utc),
                        new Date(new Date(window.timestamp_utc).getTime() + 3 * 60 * 60 * 1000)
                      )}
                    </p>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-2xl ${getScoreClass(score)}`}>
                  {score || '--'}
                </div>
              </div>

              {/* Conditions */}
              {window && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🌊</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {window.wave_height ? `${convertWaveHeight(window.wave_height).toFixed(1)}${getWaveUnitLabel()}` : '--'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {window.wave_period?.toFixed(0)}s period
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">💨</div>
                    <div className="text-sm font-semibold text-gray-900 capitalize">
                      {window.wind_orientation || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {window.wind_speed ? `${convertWindSpeed(window.wind_speed * 3.6).toFixed(0)} ${getWindUnitLabel()}` : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🌅</div>
                    <div className="text-sm font-semibold text-gray-900">Rising</div>
                    <div className="text-xs text-gray-500">Mid tide</div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {window?.explanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold">✨ </span>
                    {window.explanation}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
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
