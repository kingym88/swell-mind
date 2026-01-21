'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePreferences, WaveUnit, WindUnit } from '@/contexts/PreferencesContext';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const {
    preferences,
    updateWaveUnit,
    updateWindUnit,
    updateIdealWaveSize,
    getWaveUnitLabel,
    getWindUnitLabel,
    getIdealWaveSizeLabel,
  } = usePreferences();

  // Modal states
  const [showWaveUnitModal, setShowWaveUnitModal] = useState(false);
  const [showWindUnitModal, setShowWindUnitModal] = useState(false);
  const [showIdealWaveSizeModal, setShowIdealWaveSizeModal] = useState(false);

  const loadUser = async () => {
    try {
      const data = await api.getProfile();
      setUser(data.user);
    } catch (err: any) {
      if (err.message.includes('401')) {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await api.signout();
    router.push('/login');
  };

  // Wave size ranges based on unit
  const getWaveSizeRanges = () => {
    if (preferences.waveUnit === 'meters') {
      return [
        { min: 0, max: 0.5, label: '0-0.5m' },
        { min: 0.5, max: 1, label: '0.5-1m' },
        { min: 1, max: 1.5, label: '1-1.5m' },
        { min: 1.5, max: 2, label: '1.5-2m' },
        { min: 2, max: 2.5, label: '2-2.5m' },
        { min: 2.5, max: 10, label: '2.5m+' },
      ];
    } else {
      return [
        { min: 0, max: 1, label: '0-1ft' },
        { min: 1, max: 2, label: '1-2ft' },
        { min: 2, max: 3, label: '2-3ft' },
        { min: 3, max: 4, label: '3-4ft' },
        { min: 4, max: 5, label: '4-5ft' },
        { min: 5, max: 6, label: '5-6ft' },
        { min: 6, max: 7, label: '6-7ft' },
        { min: 7, max: 8, label: '7-8ft' },
        { min: 8, max: 30, label: '8ft+' },
      ];
    }
  };

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
        <header className="bg-white p-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Profile */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">PROFILE</h2>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">👤 Name</span>
                <span className="text-sm font-semibold">{user?.display_name || 'User'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">📧 Email</span>
                <span className="text-sm font-semibold">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">PREFERENCES</h2>
            <div className="bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => setShowWaveUnitModal(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">📏 Wave Units</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold capitalize">
                    {preferences.waveUnit === 'meters' ? 'Meters' : 'Feet'}
                  </span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={() => setShowWindUnitModal(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">💨 Wind Units</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{getWindUnitLabel()}</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={() => setShowIdealWaveSizeModal(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm">🌊 Ideal Wave Size</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{getIdealWaveSizeLabel()}</span>
                  <span className="text-gray-400">›</span>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">NOTIFICATIONS</h2>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">🔔 High Score Alerts</span>
                <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">📅 Daily Forecast</span>
                <div className="w-12 h-6 bg-[var(--surf-blue)] rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">ACCOUNT</h2>
            <div className="bg-white rounded-xl overflow-hidden">
              <button className="w-full p-4 text-left text-sm hover:bg-gray-50 transition-colors">
                🔒 Change Password
              </button>
              <button className="w-full p-4 text-left text-sm hover:bg-gray-50 transition-colors">
                📊 Export Data
              </button>
              <button
                onClick={handleSignOut}
                className="w-full p-4 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                🚪 Sign Out
              </button>
              <button className="w-full p-4 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                🗑️ Delete Account
              </button>
            </div>
          </div>

          {/* About */}
          <div className="text-center text-xs text-gray-500 pb-4">
            <p>SwellMind v1.0.0</p>
            <p>Made with 🌊 for surfers</p>
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
        <Link href="/spots" className="nav-item">
          <span className="nav-icon">📍</span>
          <span className="nav-label">Spots</span>
        </Link>
        <Link href="/settings" className="nav-item active">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </Link>
      </nav>

      {/* Wave Unit Modal */}
      {showWaveUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={() => setShowWaveUnitModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Wave Units</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  updateWaveUnit('meters');
                  setShowWaveUnitModal(false);
                }}
                className={`w-full p-4 rounded-xl text-left transition-colors ${
                  preferences.waveUnit === 'meters'
                    ? 'bg-[var(--surf-blue)] text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Meters (m)</div>
                <div className="text-sm opacity-75">Metric system</div>
              </button>
              <button
                onClick={() => {
                  updateWaveUnit('feet');
                  setShowWaveUnitModal(false);
                }}
                className={`w-full p-4 rounded-xl text-left transition-colors ${
                  preferences.waveUnit === 'feet'
                    ? 'bg-[var(--surf-blue)] text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-semibold">Feet (ft)</div>
                <div className="text-sm opacity-75">Imperial system</div>
              </button>
            </div>
            <button
              onClick={() => setShowWaveUnitModal(false)}
              className="w-full p-4 bg-gray-200 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Wind Unit Modal */}
      {showWindUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={() => setShowWindUnitModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Wind Units</h3>
            <div className="space-y-2">
              {[
                { value: 'kmh' as WindUnit, label: 'km/h', desc: 'Kilometers per hour' },
                { value: 'mph' as WindUnit, label: 'mph', desc: 'Miles per hour' },
                { value: 'knots' as WindUnit, label: 'kn', desc: 'Knots' },
                { value: 'ms' as WindUnit, label: 'm/s', desc: 'Meters per second' },
              ].map((unit) => (
                <button
                  key={unit.value}
                  onClick={() => {
                    updateWindUnit(unit.value);
                    setShowWindUnitModal(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    preferences.windUnit === unit.value
                      ? 'bg-[var(--surf-blue)] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{unit.label}</div>
                  <div className="text-sm opacity-75">{unit.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWindUnitModal(false)}
              className="w-full p-4 bg-gray-200 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ideal Wave Size Modal */}
      {showIdealWaveSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={() => setShowIdealWaveSizeModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Ideal Wave Size</h3>
            <div className="space-y-2">
              {getWaveSizeRanges().map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    updateIdealWaveSize(range.min, range.max);
                    setShowIdealWaveSizeModal(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    preferences.idealWaveSizeMin === range.min && preferences.idealWaveSizeMax === range.max
                      ? 'bg-[var(--surf-blue)] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{range.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowIdealWaveSizeModal(false)}
              className="w-full p-4 bg-gray-200 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
