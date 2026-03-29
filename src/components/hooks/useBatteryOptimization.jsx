import { useState, useEffect } from 'react';

/**
 * Battery Optimization Hook
 * Adjusts performance based on battery level
 */
export function useBatteryOptimization() {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(true);
  const [shouldOptimize, setShouldOptimize] = useState(false);

  useEffect(() => {
    let battery = null;

    const updateBatteryInfo = (batteryObj) => {
      setBatteryLevel(batteryObj.level);
      setIsCharging(batteryObj.charging);
      
      // Optimize if battery is low and not charging
      const optimize = batteryObj.level < 0.2 && !batteryObj.charging;
      setShouldOptimize(optimize);
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then(batteryObj => {
        battery = batteryObj;
        updateBatteryInfo(batteryObj);

        const handleLevelChange = () => updateBatteryInfo(batteryObj);
        const handleChargingChange = () => updateBatteryInfo(batteryObj);

        batteryObj.addEventListener('levelchange', handleLevelChange);
        batteryObj.addEventListener('chargingchange', handleChargingChange);

        return () => {
          batteryObj.removeEventListener('levelchange', handleLevelChange);
          batteryObj.removeEventListener('chargingchange', handleChargingChange);
        };
      });
    }
  }, []);

  return {
    batteryLevel: Math.round(batteryLevel * 100),
    isCharging,
    shouldOptimize,
    shouldReduceAnimations: shouldOptimize,
    shouldReduceQuality: shouldOptimize
  };
}