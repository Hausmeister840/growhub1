import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GrowPlanGenerator({ diary, onClose, onPlanGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const prompt = `Du bist ein Cannabis-Grow-Experte. Erstelle einen optimalen Anbauplan für folgendes Setup:

Sorte: ${diary.strain_name}
Aktuelle Phase: ${diary.current_stage}
Anbau: ${diary.setup_type} (${diary.grow_method})
Pflanzen: ${diary.plant_count}
Grow-Tag: ${Math.max(0, Math.floor((Date.now() - new Date(diary.start_date).getTime()) / 86400000))}

Erstelle einen detaillierten Plan mit konkreten Werten für:
1. Bewässerung (Intervall in Stunden, Menge in ml, pH-Ziel)
2. Düngung (Intervall in Tagen, EC-Zielwert, NPK-Verhältnis)
3. Beleuchtung (Stunden an/aus, PPFD-Zielwert)
4. Umgebung (Temperatur min/max, Luftfeuchte min/max)

Passe die Werte spezifisch an die Sorte "${diary.strain_name}" und die Phase "${diary.current_stage}" an.
Berücksichtige die Anbaumethode "${diary.grow_method}" für die Bewässerung.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            watering: {
              type: 'object',
              properties: {
                interval_hours: { type: 'number' },
                amount_ml: { type: 'number' },
                ph_target: { type: 'number' },
                notes: { type: 'string' },
              },
            },
            feeding: {
              type: 'object',
              properties: {
                interval_days: { type: 'number' },
                ec_target: { type: 'number' },
                npk_ratio: { type: 'string' },
                notes: { type: 'string' },
              },
            },
            lighting: {
              type: 'object',
              properties: {
                hours_on: { type: 'number' },
                hours_off: { type: 'number' },
                ppfd_target: { type: 'number' },
                notes: { type: 'string' },
              },
            },
            environment: {
              type: 'object',
              properties: {
                temp_min: { type: 'number' },
                temp_max: { type: 'number' },
                humidity_min: { type: 'number' },
                humidity_max: { type: 'number' },
                notes: { type: 'string' },
              },
            },
          },
        },
      });

      const now = new Date();
      const tasks = [];

      // Build tasks from AI plan
      if (result.watering?.interval_hours > 0) {
        tasks.push({
          id: `water_${Date.now()}`,
          type: 'watering',
          title: '💧 Gießen',
          description: `${result.watering.amount_ml}ml, pH ${result.watering.ph_target}`,
          interval_hours: result.watering.interval_hours,
          last_done: null,
          next_due: new Date(now.getTime() + result.watering.interval_hours * 3600000).toISOString(),
          priority: 'high',
          auto_remind: true,
        });
      }

      if (result.feeding?.interval_days > 0) {
        tasks.push({
          id: `feed_${Date.now()}`,
          type: 'feeding',
          title: '🧪 Düngen',
          description: `EC ${result.feeding.ec_target}, NPK ${result.feeding.npk_ratio}`,
          interval_hours: result.feeding.interval_days * 24,
          last_done: null,
          next_due: new Date(now.getTime() + result.feeding.interval_days * 86400000).toISOString(),
          priority: 'medium',
          auto_remind: true,
        });
      }

      tasks.push({
        id: `light_${Date.now()}`,
        type: 'lighting',
        title: '☀️ Licht prüfen',
        description: `${result.lighting?.hours_on || 18}/${result.lighting?.hours_off || 6}h, ${result.lighting?.ppfd_target || 400} PPFD`,
        interval_hours: 24,
        last_done: null,
        next_due: new Date(now.getTime() + 86400000).toISOString(),
        priority: 'medium',
        auto_remind: true,
      });

      tasks.push({
        id: `env_${Date.now()}`,
        type: 'environment',
        title: '🌡️ Umgebung prüfen',
        description: `${result.environment?.temp_min}-${result.environment?.temp_max}°C, ${result.environment?.humidity_min}-${result.environment?.humidity_max}% rH`,
        interval_hours: 12,
        last_done: null,
        next_due: new Date(now.getTime() + 43200000).toISOString(),
        priority: 'low',
        auto_remind: true,
      });

      const newPlan = {
        ...result,
        generated_at: now.toISOString(),
        tasks,
      };

      await base44.entities.GrowDiary.update(diary.id, { grow_plan: newPlan });
      setGenerated(true);
      toast.success('KI-Anbauplan erstellt! 🌱');

      setTimeout(() => onPlanGenerated?.(newPlan), 800);
    } catch (err) {
      console.error('Plan generation error:', err);
      toast.error('Fehler beim Generieren');
    } finally {
      setIsGenerating(false);
    }
  }, [diary, onPlanGenerated]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">KI-Anbauplan</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Personalisierter Plan</p>
              <p className="text-xs text-zinc-400">Optimiert für {diary.strain_name}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Die KI analysiert deine Sorte, Phase ({diary.current_stage}), Anbaumethode ({diary.grow_method})
            und erstellt einen maßgeschneiderten Plan mit exakten Werten.
          </p>
        </div>

        <div className="space-y-2 text-xs text-zinc-400">
          <p className="flex items-center gap-2"><span>💧</span> Gieß-Intervall & Menge</p>
          <p className="flex items-center gap-2"><span>🧪</span> Düngungsplan & NPK-Ratio</p>
          <p className="flex items-center gap-2"><span>☀️</span> Lichtzyklen & PPFD</p>
          <p className="flex items-center gap-2"><span>🌡️</span> Temperatur & Luftfeuchte</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || generated}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            generated
              ? 'bg-green-500 text-black'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50'
          }`}
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generiere Plan...</>
          ) : generated ? (
            <><Check className="w-5 h-5" /> Plan erstellt!</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Plan generieren</>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}