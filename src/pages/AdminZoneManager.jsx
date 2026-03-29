import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Download, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * 🗺️ ADMIN: ZONE MANAGER
 * Für Admins zum Verwalten von NoGo-Zonen
 */

export default function AdminZoneManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [zones, setZones] = useState([]);

  const handleImportGermanZones = async () => {
    setIsLoading(true);
    setImportResult(null);

    try {
      const response = await base44.functions.invoke('zones/loadGermanNoGoZones', {
        maxResults: 1000
      });

      if (response.data?.success) {
        setImportResult(response.data);
        toast.success('Import erfolgreich', {
          description: `${response.data.total_imported} Zonen importiert`
        });
      } else {
        throw new Error(response.data?.error || 'Import fehlgeschlagen');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import fehlgeschlagen', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const loadedZones = await base44.entities.NoGoZone.list('-created_date', 100);
      setZones(loadedZones);
    } catch (error) {
      console.error('Load zones failed:', error);
      toast.error('Zonen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadZones();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🗺️ NoGo-Zonen Manager</h1>
          <p className="text-zinc-400">Verwalte Schutzzonen für Deutschland</p>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  Deutsche Schutzzonen importieren
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Lädt Schulen, Kindergärten, Spielplätze und Jugendeinrichtungen aus OpenStreetMap
                </p>
                <Button
                  onClick={handleImportGermanZones}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import starten
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  Aktuelle Zonen
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  {zones.length} Schutzzonen in der Datenbank
                </p>
                <Button
                  onClick={loadZones}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Neu laden
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Import Result */}
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="font-bold text-lg text-green-400">
                Import erfolgreich!
              </h3>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(importResult.results || {}).map(([type, data]) => (
                <div key={type} className="bg-black/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {data.imported || 0}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Zones List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Geladene Zonen</h3>
          
          {zones.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Zonen geladen</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-zinc-800/50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-white">{zone.name}</div>
                    <div className="text-sm text-zinc-400">
                      {zone.type} • {zone.source}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}