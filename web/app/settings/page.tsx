'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

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

  const handleSignOut = async () => {
    await api.signout();
    router.push('/login');
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
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">📏 Wave Units</span>
                <span className="text-sm font-semibold capitalize">{user?.units_wave || 'Meters'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">💨 Wind Units</span>
                <span className="text-sm font-semibold">{user?.units_wind || 'km/h'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">🌊 Ideal Wave Size</span>
                <span className="text-sm font-semibold">
                  {user?.ideal_wave_size_min}-{user?.ideal_wave_size_max}m
                </span>
              </div>
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
    </div>
  );
}
