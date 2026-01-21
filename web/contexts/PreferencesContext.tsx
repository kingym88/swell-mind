'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WaveUnit = 'meters' | 'feet';
export type WindUnit = 'kmh' | 'mph' | 'knots' | 'ms';

interface Preferences {
  waveUnit: WaveUnit;
  windUnit: WindUnit;
  idealWaveSizeMin: number;
  idealWaveSizeMax: number;
}

interface PreferencesContextType {
  preferences: Preferences;
  updateWaveUnit: (unit: WaveUnit) => void;
  updateWindUnit: (unit: WindUnit) => void;
  updateIdealWaveSize: (min: number, max: number) => void;
  convertWaveHeight: (meters: number) => number;
  convertWindSpeed: (kmh: number) => number;
  getWaveUnitLabel: () => string;
  getWindUnitLabel: () => string;
  getIdealWaveSizeLabel: () => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: Preferences = {
  waveUnit: 'meters',
  windUnit: 'kmh',
  idealWaveSizeMin: 1,
  idealWaveSizeMax: 2,
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Initialize preferences from localStorage using lazy initializer
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('swellmind_preferences');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Invalid stored data, use defaults
        }
      }
    }
    return DEFAULT_PREFERENCES;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('swellmind_preferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const updateWaveUnit = (unit: WaveUnit) => {
    setPreferences(prev => {
      // Convert ideal wave size when changing units
      let newMin = prev.idealWaveSizeMin;
      let newMax = prev.idealWaveSizeMax;
      
      if (prev.waveUnit === 'meters' && unit === 'feet') {
        // Convert meters to feet
        newMin = Math.round(prev.idealWaveSizeMin * 3.28084);
        newMax = Math.round(prev.idealWaveSizeMax * 3.28084);
      } else if (prev.waveUnit === 'feet' && unit === 'meters') {
        // Convert feet to meters
        newMin = Math.round((prev.idealWaveSizeMin / 3.28084) * 10) / 10;
        newMax = Math.round((prev.idealWaveSizeMax / 3.28084) * 10) / 10;
      }
      
      return {
        ...prev,
        waveUnit: unit,
        idealWaveSizeMin: newMin,
        idealWaveSizeMax: newMax,
      };
    });
  };

  const updateWindUnit = (unit: WindUnit) => {
    setPreferences(prev => ({ ...prev, windUnit: unit }));
  };

  const updateIdealWaveSize = (min: number, max: number) => {
    setPreferences(prev => ({
      ...prev,
      idealWaveSizeMin: min,
      idealWaveSizeMax: max,
    }));
  };

  // Convert wave height from meters to user's preferred unit
  const convertWaveHeight = (meters: number): number => {
    if (preferences.waveUnit === 'feet') {
      return meters * 3.28084; // meters to feet
    }
    return meters;
  };

  // Convert wind speed from km/h to user's preferred unit
  const convertWindSpeed = (kmh: number): number => {
    switch (preferences.windUnit) {
      case 'mph':
        return kmh * 0.621371; // km/h to mph
      case 'knots':
        return kmh * 0.539957; // km/h to knots
      case 'ms':
        return kmh * 0.277778; // km/h to m/s
      default:
        return kmh;
    }
  };

  const getWaveUnitLabel = (): string => {
    return preferences.waveUnit === 'meters' ? 'm' : 'ft';
  };

  const getWindUnitLabel = (): string => {
    switch (preferences.windUnit) {
      case 'mph':
        return 'mph';
      case 'knots':
        return 'kn';
      case 'ms':
        return 'm/s';
      default:
        return 'km/h';
    }
  };

  const getIdealWaveSizeLabel = (): string => {
    const unit = getWaveUnitLabel();
    return `${preferences.idealWaveSizeMin}-${preferences.idealWaveSizeMax}${unit}`;
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updateWaveUnit,
        updateWindUnit,
        updateIdealWaveSize,
        convertWaveHeight,
        convertWindSpeed,
        getWaveUnitLabel,
        getWindUnitLabel,
        getIdealWaveSizeLabel,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
