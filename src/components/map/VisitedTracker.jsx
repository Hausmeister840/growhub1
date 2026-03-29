/**
 * Visited locations tracker — stores in user entity.
 * Provides hooks for tracking and reading visited places.
 */

import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useVisitedTracker(currentUser) {
  const visited = currentUser?.visited_locations || [];

  const markVisited = useCallback(async (locationId, locationName) => {
    if (!currentUser) return;
    if (visited.some(v => v.id === locationId)) return;

    const entry = {
      id: locationId,
      name: locationName,
      visited_at: new Date().toISOString(),
    };
    const updated = [...visited, entry];

    try {
      await base44.auth.updateMe({ visited_locations: updated });
      toast.success(`${locationName} als besucht markiert ✓`);
      return updated;
    } catch {
      toast.error('Fehler beim Speichern');
      return visited;
    }
  }, [currentUser, visited]);

  const isVisited = useCallback((locationId) => {
    return visited.some(v => v.id === locationId);
  }, [visited]);

  return { visited, markVisited, isVisited };
}