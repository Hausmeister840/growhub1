
export const GEO_ERRORS = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
};

export function getCurrentPositionPromise(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject({ code: GEO_ERRORS.UNKNOWN, message: "Geolocation not supported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        let code = GEO_ERRORS.UNKNOWN;
        if (err?.code === 1) code = GEO_ERRORS.PERMISSION_DENIED;
        else if (err?.code === 2) code = GEO_ERRORS.POSITION_UNAVAILABLE;
        else if (err?.code === 3) code = GEO_ERRORS.TIMEOUT;
        reject({ code, message: err?.message || "Geolocation error" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...options }
    );
  });
}

// Liefert eine sichere Position oder einen sanften Fallback (Mitte DE)
export async function getCurrentPositionSafe(options = {}) {
  try {
    const pos = await getCurrentPositionPromise(options);
    return { ok: true, coords: pos.coords, source: "geolocation" };
  } catch (e) {
    console.warn("Geolocation Error:", e?.code || e);
    // Sanfter Fallback – kein Crash der App
    return {
      ok: false,
      coords: { latitude: 51.163375, longitude: 10.447683, accuracy: 50000 }, // Deutschland Mitte
      source: "fallback",
      error: e,
    };
  }
}

// Alias-Namen für evtl. bestehende Importe
export const getUserLocation = getCurrentPositionSafe;
export const getCurrentPositionSafeFn = getCurrentPositionSafe;

// Legal constants and type labels for geofencing and UI
export const LEGAL_CONSTANTS = {
  SIGHT_DISTANCE_METERS: 100,
  PEDESTRIAN_ACTIVE_HOURS: { start: 7, end: 20 }
};

const TYPE_LABELS = {
  school: 'Schule',
  kindergarten: 'Kita/Kindergarten',
  playground: 'Spielplatz',
  youth_centre: 'Jugendeinrichtung',
  sports: 'Sportstätte',
  pedestrian_area: 'Fußgängerzone',
  cannabis_club: 'Cannabis Club',
  cannabis_shop: 'Cannabis Shop'
};

function getTypeFromTags(tags = {}) {
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const highway = tags.highway;
  const shop = tags.shop;

  if (amenity === 'school') return 'school';
  if (amenity === 'kindergarten' || amenity === 'childcare') return 'kindergarten';
  if (leisure === 'playground') return 'playground';
  if (amenity === 'youth_centre' || amenity === 'community_centre') return 'youth_centre';
  if (leisure === 'sports_centre' || leisure === 'stadium' || leisure === 'pitch' || leisure === 'track') return 'sports';
  if (highway === 'pedestrian') return 'pedestrian_area';
  if (amenity === 'cannabis_club') return 'cannabis_club';
  if (shop === 'cannabis') return 'cannabis_shop';
  return null;
}

function getCoordinates(element) {
  // Node
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return [{ latitude: element.lat, longitude: element.lon }];
  }
  // Way/Relation with geometry
  if (Array.isArray(element.geometry) && element.geometry.length > 0) {
    return element.geometry.map((g) => ({
      latitude: g.lat,
      longitude: g.lon
    }));
  }
  // Fallback empty
  return [];
}

function buildFence(element) {
  const type = getTypeFromTags(element.tags || {});
  if (!type) return null;

  const coordinates = getCoordinates(element);
  if (coordinates.length === 0) return null;

  const isTimeDependent = type === 'pedestrian_area';
  const name =
    (element.tags && (element.tags.name || element.tags['ref'])) ||
    TYPE_LABELS[type] ||
    'Ort';

  const fence = {
    id: `f-${element.id}`,
    element,
    type,
    name,
    coordinates,
    isTimeDependent,
    isCurrentlyActive() {
      if (!this.isTimeDependent) return false;
      const hours = LEGAL_CONSTANTS.PEDESTRIAN_ACTIVE_HOURS || { start: 7, end: 20 };
      const now = new Date();
      const h = now.getHours();
      return h >= hours.start && h < hours.end;
    },
    isNoGoZone() {
      return ['school', 'kindergarten', 'playground', 'youth_centre', 'sports'].includes(this.type);
    },
    getTypeLabel() {
      return TYPE_LABELS[this.type] || 'Ort';
    }
  };

  return fence;
}

function toRad(n) { return (n * Math.PI) / 180; }
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple in-memory engine to support map geofencing UX
const callbacks = [];
let active = false;
let lastViolations = new Map(); // fenceId -> violation

const engine = {
  fences: [],
  addCallback(fn) {
    if (typeof fn !== 'function') return () => {};
    callbacks.push(fn);
    return () => {
      const idx = callbacks.indexOf(fn);
      if (idx > -1) callbacks.splice(idx, 1);
    };
  },
  start() { active = true; },
  stop() { active = false; },
  updateFences(elements = []) {
    this.fences = (elements || [])
      .map(buildFence)
      .filter(Boolean);
  },
  getStatistics() {
    const out = { total: this.fences.length };
    this.fences.forEach((f) => {
      out[f.type] = (out[f.type] || 0) + 1;
    });
    return out;
  },
  checkPosition(pos) {
    if (!active || !pos || typeof pos.lat !== 'number' || typeof pos.lng !== 'number') return;

    const violations = [];
    const newViolations = [];
    const endedViolations = [];
    const sight = LEGAL_CONSTANTS.SIGHT_DISTANCE_METERS || 100;

    const stillViolating = new Map();

    for (const f of this.fences) {
      let min = Infinity;
      for (const c of f.coordinates || []) {
        const d = haversineMeters(pos.lat, pos.lng, c.latitude, c.longitude);
        if (d < min) min = d;
      }
      const banActive = f.isNoGoZone() || (f.type === 'pedestrian_area' && f.isCurrentlyActive());
      if (banActive && min <= sight) {
        const v = {
          fence: f,
          distance: min,
          severity: f.type === 'pedestrian_area' ? 'warning' : 'critical',
          reason: `${f.getTypeLabel()} in ~${Math.round(min)}m`
        };
        violations.push(v);
        stillViolating.set(f.id, v);
        if (!lastViolations.has(f.id)) newViolations.push(v);
      }
    }

    for (const [fid, oldV] of lastViolations.entries()) {
      if (!stillViolating.has(fid)) endedViolations.push(oldV);
    }
    lastViolations = stillViolating;

    const payload = {
      violations,
      newViolations,
      endedViolations,
      position: pos,
      timestamp: Date.now()
    };
    callbacks.forEach((fn) => {
      try { fn(payload); } catch (e) { console.warn('geofencing callback error:', e); }
    });
  }
};

export const geofencingEngine = engine;
