'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePreferences } from '@/contexts/PreferencesContext';

export default function SessionsPage() {
  const router = useRouter();
  const { convertWaveHeight, getWaveUnitLabel } = usePreferences();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'insights'>('recent');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data.sessions);
    } catch (err: any) {
      if (err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="phone-frame flex items-center justify-center">
        <p className="text-gray-600">Loading sessions...</p>
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
      <div className="flex flex-col h-[calc(100%-108px)] overflow-hidden">
        {/* Header */}
        <header className="bg-white p-4 flex items-center gap-4">
          <Link href="/" className="text-2xl">←</Link>
          <h1 className="text-xl font-bold">Sessions</h1>
        </header>

        {/* Tabs */}
        <div className="bg-white px-4 pb-2 flex gap-2">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'recent'
                ? 'bg-[var(--surf-blue)] text-white'
                : 'bg-[var(--foam-white)] text-gray-600'
            }`}
          >
            Recent Sessions
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'insights'
                ? 'bg-[var(--surf-blue)] text-white'
                : 'bg-[var(--foam-white)] text-gray-600'
            }`}
          >
            Insights
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'recent' ? (
            sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏄</div>
                <h2 className="text-2xl font-bold mb-2">No sessions yet</h2>
                <p className="text-gray-600 mb-6">
                  Start logging your surf sessions!
                </p>
                <Link href="/log" className="inline-block bg-[var(--surf-blue)] text-white px-6 py-3 rounded-xl font-semibold">
                  Log Your First Session
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="session-card animate-fade-in">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full text-2xl">
                      🏄
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg">
                          {session.spot?.name || 'Unknown Spot'}
                        </h3>
                        <div className="px-3 py-1 bg-white/25 rounded-full text-sm font-semibold">
                          ⭐ {session.overall_rating}/10
                        </div>
                      </div>
                      <p className="text-xs opacity-90 mb-2">
                        {format(new Date(session.surf_timestamp_utc), 'EEEE, MMM d · h:mm a')}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${session.overall_rating * 10}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{session.overall_rating * 10}%</span>
                      </div>

                      {/* Conditions */}
                      {session.forecast && (
                        <div className="text-sm">
                          🌊 {session.forecast.wave_height ? `${convertWaveHeight(session.forecast.wave_height).toFixed(1)}${getWaveUnitLabel()}` : '--'} @ {session.forecast.wave_period?.toFixed(0)}s
                          {' · '}
                          💨 <span className="capitalize">{session.forecast.wind_orientation || 'N/A'}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {session.notes && (
                        <div className="mt-2 text-sm italic opacity-90">
                          "{session.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Insights Tab */
            <div className="space-y-4">
              {/* Insights Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--sunset-orange)] via-[var(--score-moderate)] to-[var(--score-good)] text-white">
                <h3 className="text-xl font-bold mb-4">You Surf Best When...</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/15 p-3 rounded-lg">
                    <div className="text-base mb-1">🌊</div>
                    <div className="text-xs opacity-80">Wave Height</div>
                    <div className="text-sm font-semibold">1.0-2.0m</div>
                  </div>
                  <div className="bg-white/15 p-3 rounded-lg">
                    <div className="text-base mb-1">⏱️</div>
                    <div className="text-xs opacity-80">Period</div>
                    <div className="text-sm font-semibold">8-12s</div>
                  </div>
                  <div className="bg-white/15 p-3 rounded-lg">
                    <div className="text-base mb-1">💨</div>
                    <div className="text-xs opacity-80">Wind</div>
                    <div className="text-sm font-semibold">Offshore</div>
                  </div>
                  <div className="bg-white/15 p-3 rounded-lg">
                    <div className="text-base mb-1">⏰</div>
                    <div className="text-xs opacity-80">Time</div>
                    <div className="text-sm font-semibold">Morning</div>
                  </div>
                </div>
                <p className="text-xs opacity-80 text-center mt-4">
                  Based on {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-2xl p-4">
                <h3 className="font-semibold mb-3">Session Stats</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="font-semibold">{sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold">
                      {sessions.length > 0
                        ? (sessions.reduce((sum, s) => sum + s.overall_rating, 0) / sessions.length).toFixed(1)
                        : '0.0'}
                      /10
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Model Confidence</span>
                    <span className="font-semibold">
                      {sessions.length >= 10 ? 'High' : sessions.length >= 3 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </Link>
        <Link href="/sessions" className="nav-item active">
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
