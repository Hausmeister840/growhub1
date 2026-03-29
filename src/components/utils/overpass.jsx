// Cannabis-Konsumkarte - Overpass API Integration
// © OpenStreetMap-Mitwirkende, ODbL-Lizenz

export class OverpassAPI {
  static ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter'
  ];

  static buildQuery(bbox) {
    return `
[out:json][timeout:25];
(
  // Schulen (§5 KCanG)
  node["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  relation["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  // Kindergärten/Kitas
  node["amenity"="kindergarten"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="kindergarten"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="childcare"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="childcare"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  // Kinderspielplätze
  node["leisure"="playground"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"="playground"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  // Jugendeinrichtungen
  node["amenity"="youth_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="youth_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="community_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="community_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  // Sportstätten
  node["leisure"="sports_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"="sports_centre"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"="pitch"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"="stadium"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["leisure"="track"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

  // Fußgängerzonen (zeitabhängig 07-20 Uhr)
  way["highway"="pedestrian"]["area"="yes"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["highway"="pedestrian"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  
  // Cannabis Clubs & Shops (erlaubte Orte)
  node["amenity"="cannabis_club"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["amenity"="cannabis_club"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["shop"="cannabis"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["shop"="cannabis"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out body geom;
`;
  }

  static async fetchWithRetry(bbox, maxRetries = 3) {
    const query = this.buildQuery(bbox);
    
    for (let i = 0; i < maxRetries; i++) {
      for (const endpoint of this.ENDPOINTS) {
        try {
          console.log(`🗺️ Overpass-Abfrage ${i + 1}/${maxRetries} an ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            body: query,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            signal: AbortSignal.timeout(30000) // 30s Timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.remark?.includes('timeout')) {
            throw new Error('Overpass-Server Timeout - Verkleinere den Kartenbereich');
          }
          
          console.log(`✅ Overpass erfolgreich: ${data.elements?.length || 0} Elemente geladen`);
          return data.elements || [];
          
        } catch (error) {
          console.warn(`❌ Overpass-Fehler bei ${endpoint}:`, error.message);
          
          if (error.name === 'TimeoutError') {
            throw new Error('Netzwerk-Timeout - Bitte Internetverbindung prüfen');
          }
          
          // Bei Rate-Limit: Warten
          if (error.message.includes('429') || error.message.includes('rate')) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
          }
        }
      }
    }
    
    throw new Error('Alle Overpass-Server nicht erreichbar. Bitte später erneut versuchen.');
  }
}

// Cache-System für Performance
export class OverpassCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 10 * 60 * 1000; // 10 Minuten
  }

  getKey(bbox) {
    // Runde Bbox für besseres Caching
    const precision = 1000;
    const roundedBbox = {
      north: Math.round(bbox.north * precision) / precision,
      south: Math.round(bbox.south * precision) / precision,
      east: Math.round(bbox.east * precision) / precision,
      west: Math.round(bbox.west * precision) / precision
    };
    return JSON.stringify(roundedBbox);
  }

  get(bbox) {
    const key = this.getKey(bbox);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log('📦 Overpass-Cache HIT');
      return cached.data;
    }
    
    return null;
  }

  set(bbox, data) {
    const key = this.getKey(bbox);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Cleanup alte Einträge
    if (this.cache.size > 50) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.cache.delete(oldest[0]);
    }
  }

  clear() {
    this.cache.clear();
  }
}

export const overpassCache = new OverpassCache();