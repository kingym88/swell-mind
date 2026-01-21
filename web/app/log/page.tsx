'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

export default function LogSessionPage() {
  const router = useRouter();
  const [spots, setSpots] = useState<any[]>([]);
  const [spotId, setSpotId] = useState('');
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessionTime, setSessionTime] = useState(format(new Date(), 'HH:mm'));
  const [rating, setRating] = useState(7);
  const [perceivedWind, setPerceivedWind] = useState('just_right');
  const [perceivedSize, setPerceivedSize] = useState(7);
  const [perceivedCrowd, setPerceivedCrowd] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      const data = await api.getSpots();
      setSpots(data.spots);
      if (data.spots.length > 0) {
        setSpotId(data.spots[0].id);
      }
    } catch (err: any) {
      if (err.message.includes('401')) {
        router.push('/login');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Combine date and time into ISO timestamp
      const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
      
      await api.logSession({
        spot_id: spotId,
        surf_timestamp_utc: sessionDateTime.toISOString(),
        overall_rating: rating,
        perceived_wind: perceivedWind as any,
        perceived_size: perceivedSize,
        perceived_crowd: perceivedCrowd,
        notes: notes || undefined
      });

      router.push('/sessions');
    } catch (err: any) {
      setError(err.message || 'Failed to log session');
    } finally {
      setLoading(false);
    }
  };

  const getRatingEmoji = () => {
    if (rating >= 9) return '🤩';
    if (rating >= 7) return '😊';
    if (rating >= 5) return '😐';
    if (rating >= 3) return '😕';
    return '😞';
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
        <header className="bg-white p-4 flex items-center gap-4">
          <Link href="/" className="text-2xl">←</Link>
          <h1 className="text-xl font-bold">Log Session</h1>
        </header>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Spot Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Spot
              </label>
              <select
                value={spotId}
                onChange={(e) => setSpotId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--surf-blue)] focus:border-transparent outline-none"
                required
              >
                {spots.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.name} - {spot.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  min={format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--surf-blue)] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⏰ Time
                </label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--surf-blue)] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⭐ Overall Rating
              </label>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{getRatingEmoji()}</div>
                <div className="text-5xl font-bold text-[var(--surf-blue)]">
                  {rating}<span className="text-2xl text-gray-400">/10</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #f87171 0%, 
                    #fbbf24 50%, 
                    #4ade80 100%)`
                }}
              />
            </div>

            {/* Wind */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💨 Wind Conditions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'too_onshore', label: 'Too Onshore', emoji: '🌬️' },
                  { value: 'just_right', label: 'Just Right', emoji: '✅' },
                  { value: 'too_weak', label: 'Too Weak', emoji: '😴' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPerceivedWind(option.value)}
                    className={`p-3 rounded-xl font-medium text-sm transition-all ${
                      perceivedWind === option.value
                        ? 'bg-[var(--surf-blue)] text-white shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{option.emoji}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wave Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌊 Wave Size: {perceivedSize}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={perceivedSize}
                onChange={(e) => setPerceivedSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Too Small</span>
                <span>Perfect</span>
                <span>Too Big</span>
              </div>
            </div>

            {/* Crowd */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👥 Crowd Level: {perceivedCrowd}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={perceivedCrowd}
                onChange={(e) => setPerceivedCrowd(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Empty</span>
                <span>Moderate</span>
                <span>Packed</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--surf-blue)] focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="How was the session? Any memorable moments?"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--surf-blue)] text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[var(--deep-ocean)] transition-all disabled:opacity-50"
            >
              {loading ? 'Logging Session...' : '✓ Log Session'}
            </button>
          </form>
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
        <Link href="/log" className="nav-item fab active">
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
