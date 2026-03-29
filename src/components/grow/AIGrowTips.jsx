import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Leaf, Droplets, Sun, Bug, TrendingUp, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIGrowTips({ entry, diary, compact = false }) {
  const [tips, setTips] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entry && !tips) {
      analyzePlant();
    }
  }, [entry]);

  const analyzePlant = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build analysis context
      // Korrekte Felder aus dem GrowDiaryEntry-Entity lesen
      const temp = entry.environment_data?.temp_c;
      const humidity = entry.environment_data?.humidity_rh;
      const ph = entry.feeding_data?.ph;
      const water = entry.feeding_data?.water_ml;
      const nutrients = entry.feeding_data?.nutrients;
      const lightSchedule = entry.environment_data?.light_schedule;

      const prompt = `Du bist ein Cannabis-Anbau-Experte. Analysiere folgenden Grow-Tagebuch-Eintrag und gib konkrete, personalisierte Tipps auf Deutsch.

**Sorte:** ${diary?.strain_name || 'Unbekannt'}
**Wachstumsphase:** ${entry.growth_stage || diary?.current_stage || 'Unbekannt'} (Tag ${entry.day_number || '?'}, Woche ${entry.week_number || '?'})
**Setup:** ${diary?.setup_type || 'Indoor'}

**Aktuelle Messwerte:**
- Temperatur: ${temp ? temp + '°C' : 'Nicht gemessen'}
- Luftfeuchtigkeit: ${humidity ? humidity + '%' : 'Nicht gemessen'}
- pH-Wert: ${ph || 'Nicht gemessen'}
- Bewässerung: ${water ? water + 'ml' : 'Nicht gemessen'}
- Nährstoffe: ${nutrients || 'Keine Angabe'}
- Lichtzyklus: ${lightSchedule || 'Keine Angabe'}
- Pflanzenhöhe: ${entry.plant_height_cm ? entry.plant_height_cm + 'cm' : 'Nicht gemessen'}

**Beobachtung des Growers:** ${entry.plant_observation || 'Keine'}
**Durchgeführte Maßnahmen:** ${entry.actions_taken?.join(', ') || 'Keine'}`;

      const fileUrls = entry.media_urls?.length > 0 ? [entry.media_urls[0]] : [];

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        file_urls: fileUrls.length > 0 ? fileUrls : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            status_summary: { type: "string" },
            tips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  action: { type: "string" }
                }
              }
            },
            warnings: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTips(response);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setError('KI-Analyse fehlgeschlagen. Versuche es später erneut.');
      toast.error('KI-Analyse fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      water: Droplets,
      light: Sun,
      nutrients: Leaf,
      temperature: TrendingUp,
      humidity: Droplets,
      pests: Bug,
      general: Sparkles
    };
    return icons[category] || Sparkles;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-400 bg-red-500/20 border-red-500/30',
      medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      low: 'text-green-400 bg-green-500/20 border-green-500/30'
    };
    return colors[priority] || colors.medium;
  };

  if (compact && !isExpanded) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!tips) analyzePlant();
          setIsExpanded(true);
        }}
        className="w-full p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl flex items-center gap-3 hover:border-green-500/40 transition-all"
      >
        <Sparkles className="w-5 h-5 text-green-400" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white">KI-Grow-Tipps</p>
          <p className="text-xs text-zinc-400">Personalisierte Empfehlungen für deine Pflanze</p>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 rounded-3xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">KI-Grow-Tipps</h3>
            <p className="text-sm text-zinc-400">Personalisierte Analyse</p>
          </div>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Analysiere Pflanzenzustand...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={analyzePlant}
            className="mt-3 text-sm text-green-400 hover:text-green-300 font-medium"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {tips && !isLoading && (
        <div className="space-y-6">
          {/* Health Score */}
          <div className="p-4 bg-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Gesundheitsscore</span>
              <span className="text-2xl font-bold text-white">{tips.health_score}/100</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tips.health_score}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${
                  tips.health_score >= 80 ? 'bg-green-500' :
                  tips.health_score >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
            </div>
            <p className="text-sm text-zinc-400 mt-2">{tips.status_summary}</p>
          </div>

          {/* Warnings */}
          {tips.warnings && tips.warnings.length > 0 && (
            <div className="space-y-2">
              {tips.warnings.map((warning, idx) => (
                <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-400">Empfehlungen</h4>
            {tips.tips && tips.tips.map((tip, idx) => {
              const Icon = getCategoryIcon(tip.category);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-2xl border ${getPriorityColor(tip.priority)}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-white mb-1">{tip.title}</h5>
                      <p className="text-sm text-zinc-300 mb-2">{tip.description}</p>
                      {tip.action && (
                        <div className="p-3 bg-black/20 rounded-xl">
                          <p className="text-xs font-medium text-white flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {tip.action}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Next Steps */}
          {tips.next_steps && tips.next_steps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-400 mb-3">Nächste Schritte</h4>
              <div className="space-y-2">
                {tips.next_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-green-400">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}