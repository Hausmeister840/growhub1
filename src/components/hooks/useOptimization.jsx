import { useState, useEffect } from 'react';
import optimizationService from '../services/OptimizationService';

/**
 * ⚡ USE OPTIMIZATION HOOK
 * Reagiert auf Performance-Änderungen
 */

export default function useOptimization() {
  const [settings, setSettings] = useState(optimizationService.getOptimalSettings());
  const [level, setLevel] = useState(optimizationService.getOptimizationLevel());

  useEffect(() => {
    const handleOptimizationChange = (event) => {
      setSettings(event.detail);
      setLevel(optimizationService.getOptimizationLevel());
    };

    window.addEventListener('optimizationChange', handleOptimizationChange);

    return () => {
      window.removeEventListener('optimizationChange', handleOptimizationChange);
    };
  }, []);

  return {
    settings,
    level,
    optimize: () => optimizationService.optimize()
  };
}