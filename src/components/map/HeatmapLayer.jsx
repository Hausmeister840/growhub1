import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Simple canvas-based heatmap using circles.
 * No external deps — draws semi-transparent circles per location.
 */
export default function HeatmapLayer({ locations, enabled }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !locations.length) return;

    const circles = locations.map(loc => {
      return L.circle([loc.latitude || loc.lat, loc.longitude || loc.lng], {
        radius: 300,
        color: 'transparent',
        fillColor: '#22c55e',
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(map);
    });

    // Create denser circles for clusters
    const gridSize = 0.005; // ~500m
    const grid = {};
    locations.forEach(loc => {
      const key = `${Math.round((loc.latitude || loc.lat) / gridSize)}_${Math.round((loc.longitude || loc.lng) / gridSize)}`;
      grid[key] = (grid[key] || 0) + 1;
    });

    const clusterCircles = Object.entries(grid)
      .filter(([, count]) => count > 1)
      .map(([key, count]) => {
        const [latKey, lngKey] = key.split('_').map(Number);
        return L.circle([latKey * gridSize, lngKey * gridSize], {
          radius: Math.min(800, 200 + count * 100),
          color: 'transparent',
          fillColor: count > 3 ? '#f59e0b' : '#22c55e',
          fillOpacity: Math.min(0.35, 0.1 + count * 0.05),
          interactive: false,
        }).addTo(map);
      });

    return () => {
      circles.forEach(c => map.removeLayer(c));
      clusterCircles.forEach(c => map.removeLayer(c));
    };
  }, [map, locations, enabled]);

  return null;
}