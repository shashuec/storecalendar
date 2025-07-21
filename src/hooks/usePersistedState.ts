import { useState, useEffect } from 'react';
import { GenerationResponse, CountryCode, BrandTone } from '@/types';

export interface PersistedState {
  currentStep: 'url' | 'auth' | 'products' | 'preferences' | 'results';
  url: string;
  selectedProducts: string[];
  selectedCountry: CountryCode;
  selectedTone: BrandTone;
  weekNumber: 1 | 2;
  result: GenerationResponse | null;
  lastUpdated: string;
}

const STORAGE_KEY = 'app-state';
const STATE_EXPIRY_HOURS = 24;

export function usePersistedState() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if state is expired
  const isStateExpired = (timestamp: string): boolean => {
    const now = new Date().getTime();
    const stateTime = new Date(timestamp).getTime();
    const expiryTime = STATE_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in ms
    return (now - stateTime) > expiryTime;
  };

  // Get persisted state from localStorage
  const getPersistedState = (): PersistedState | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed: PersistedState = JSON.parse(stored);
      
      // Check if state is expired
      if (isStateExpired(parsed.lastUpdated)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error reading persisted state:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  // Save state to localStorage
  const saveState = (state: Partial<PersistedState>) => {
    if (typeof window === 'undefined') return;
    
    try {
      const currentState = getPersistedState();
      const newState: PersistedState = {
        currentStep: 'url',
        url: '',
        selectedProducts: [],
        selectedCountry: 'US',
        selectedTone: 'casual',
        weekNumber: 1,
        result: null,
        lastUpdated: new Date().toISOString(),
        ...currentState,
        ...state,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // Clear persisted state
  const clearState = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  };

  // Load state on component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return {
    isLoaded,
    getPersistedState,
    saveState,
    clearState,
  };
}