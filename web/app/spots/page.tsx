'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SpotsPage() {
  const router = useRouter();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      const data = await api.getSpots();
      setSpots(data.spots);
    } catch (err: any) {
      if (err.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold">Surf Spots</h1>
          <p className="text-sm text-gray-600">15 spots in Portugal</p>
        </header>

        {/* Map Placeholder */}
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 h-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
          <div className="text-center z-10">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm text-gray-600">Map view coming soon</p>
          </div>
        </div>

        {/* Spots List */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h2 className="font-semibold mb-3">Your Spots</h2>
          <div className="space-y-2">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">📍</span>
                      <h3 className="font-semibold">{spot.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="capitalize">{spot.region}</span>
                      <span>•</span>
                      <span className="capitalize">{spot.difficulty}</span>
                      <span>•</span>
                      <span className="capitalize">{spot.break_type}</span>
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </Link>
            ))}
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
