import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Plus, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TASK_TYPE_MAP = {
  'gießen': 'watering',
  'wässern': 'watering',
  'wasser': 'watering',
  'düngen': 'feeding',
  'nährstoff': 'feeding',
  'licht': 'lighting',
  'beleuchtung': 'lighting',
  'temperatur': 'environment',
  'feuchtigkeit': 'environment',
  'umgebung': 'environment',
  'klima': 'environment',
  'lüften': 'environment',
  'training': 'training',
  'beschneiden': 'training',
  'topping': 'training',
  'lst': 'training',
  'prüfen': 'inspection',
  'kontrollieren': 'inspection',
};

function detectTaskType(title) {
  const lower = (title || '').toLowerCase();
  for (const [keyword, type] of Object.entries(TASK_TYPE_MAP)) {
    if (lower.includes(keyword)) return type;
  }
  return 'custom';
}

const PRIORITY_COLORS = {
  high: 'bg-red-500/15 border-red-500/30 text-red-400',
  medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  low: 'bg-green-500/15 border-green-500/30 text-green-400',
};

const PRIORITY_LABELS = { high: 'Dringend', medium: 'Wichtig', low: 'Normal' };

function SuggestedTaskCard({ task, onAdd, added }) {
  const priorityClass = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3.5 rounded-2xl border transition-all ${added ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.03] border-white/[0.08]'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white">{task.title}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${priorityClass}`}>
              {PRIORITY_LABELS[task.priority] || 'Normal'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{task.reason}</p>
          {task.timing && (
            <p className="text-[11px] text-zinc-500 mt-1">⏰ {task.timing}</p>
          )}
        </div>
        <button
          onClick={() => onAdd(task)}
          disabled={added}
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
            added ? 'bg-green-500 text-black' : 'bg-white/10 text-white hover:bg-green-500 hover:text-black'
          }`}
        >
          {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

export default function AITaskAdvisor({ diary, entries, onTasksAdded }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const latestEntry = entries?.[0];
  const stage = diary?.current_stage || 'Wachstum';
  const plan = diary?.grow_plan || {};

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    setSuggestions([]);
    setAddedIds(new Set());

    // Gather sensor data from latest entries
    const recentEntries = (entries || []).slice(0, 5);
    const sensorSummary = recentEntries.map(e => {
      const env = e.environment_data || {};
      const feed = e.feeding_data || {};
      return [
        e.day_number ? `Tag ${e.day_number}` : '',
        env.temp_c ? `${env.temp_c}°C` : '',
        env.humidity_rh ? `${env.humidity_rh}%rH` : '',
        feed.ph ? `pH ${feed.ph}` : '',
        feed.ec_ppm ? `EC ${feed.ec_ppm}` : '',
        e.plant_height_cm ? `${e.plant_height_cm}cm` : '',
        (e.quick_actions || []).join(', '),
      ].filter(Boolean).join(' · ');
    }).filter(Boolean).join('\n');

    const planSummary = [
      plan.watering?.interval_hours ? `Gießen alle ${plan.watering.interval_hours}h, ${plan.watering.amount_ml}ml` : '',
      plan.feeding?.interval_days ? `Düngen alle ${plan.feeding.interval_days}T, EC ${plan.feeding.ec_target}` : '',
      plan.lighting?.hours_on ? `Licht ${plan.lighting.hours_on}/${plan.lighting.hours_off}h` : '',
      plan.environment ? `Klima: ${plan.environment.temp_min}-${plan.environment.temp_max}°C, ${plan.environment.humidity_min}-${plan.environment.humidity_max}%rH` : '',
    ].filter(Boolean).join('\n');

    const prompt = `Du bist ein Anbau-Berater. Analysiere den Grow und schlage 3-5 konkrete Aufgaben für die nächsten 24-48 Stunden vor.

GROW:
- Phase: ${stage}
- Sorte: ${diary?.strain_name || 'unbekannt'}
- Methode: ${diary?.grow_method || 'soil'}
- Pflanzen: ${diary?.plant_count || 1}
- Grow gestartet: ${diary?.start_date || 'unbekannt'}

AKTUELLER PLAN:
${planSummary || 'Kein Plan vorhanden'}

LETZTE EINTRÄGE (neueste zuerst):
${sensorSummary || 'Keine Daten'}

${latestEntry?.plant_observation ? `LETZTE BEOBACHTUNG: ${latestEntry.plant_observation}` : ''}
${latestEntry?.ai_analysis?.detected_issues?.length ? `KI-ERKANNTE PROBLEME: ${latestEntry.ai_analysis.detected_issues.map(i => i.description).join(', ')}` : ''}

Gib für jede Aufgabe: title (kurz, mit Emoji), reason (1 Satz warum), priority (high/medium/low), timing (wann genau), interval_hours (Wiederholungsintervall oder 0 wenn einmalig).
Sei KONKRET und PROAKTIV — reagiere auf die Sensordaten und Phase.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string' },
                  timing: { type: 'string' },
                  interval_hours: { type: 'number' },
                }
              }
            },
            summary: { type: 'string' },
          }
        },
      });

      const tasks = (result?.tasks || []).map((t, i) => ({
        ...t,
        id: `ai_${Date.now()}_${i}`,
        icon: (() => {
          const type = detectTaskType(t.title);
          const icons = { watering: '💧', feeding: '🧪', lighting: '☀️', environment: '🌡️', training: '✂️', inspection: '🔍', custom: '📋' };
          return icons[type] || '📋';
        })(),
        type: detectTaskType(t.title),
      }));

      setSuggestions(tasks);
      setHasGenerated(true);
      if (result?.summary) {
        toast.success(result.summary, { duration: 4000 });
      }
    } catch (err) {
      console.error('AI Advisor error:', err);
      toast.error('KI-Vorschläge konnten nicht geladen werden');
    } finally {
      setIsGenerating(false);
    }
  }, [diary, entries, latestEntry, stage, plan]);

  const handleAddTask = useCallback(async (task) => {
    if (addedIds.has(task.id)) return;

    const now = new Date();
    const intervalHours = task.interval_hours || 24;
    
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: task.type || 'custom',
      title: task.title,
      description: task.reason || '',
      interval_hours: intervalHours,
      last_done: null,
      next_due: new Date(now.getTime() + intervalHours * 3600000).toISOString(),
      priority: task.priority || 'medium',
      auto_remind: true,
      ai_generated: true,
    };

    const currentTasks = diary?.grow_plan?.tasks || [];
    const updatedTasks = [...currentTasks, newTask];
    const updatedPlan = { ...diary?.grow_plan, tasks: updatedTasks };

    try {
      await base44.entities.GrowDiary.update(diary.id, { grow_plan: updatedPlan });
      setAddedIds(prev => new Set([...prev, task.id]));
      onTasksAdded?.({ ...diary, grow_plan: updatedPlan });
      toast.success(`"${task.title}" zum Plan hinzugefügt!`);
    } catch {
      toast.error('Fehler beim Hinzufügen');
    }
  }, [diary, addedIds, onTasksAdded]);

  const handleAddAll = useCallback(async () => {
    const toAdd = suggestions.filter(s => !addedIds.has(s.id));
    if (!toAdd.length) return;

    const now = new Date();
    const newTasks = toAdd.map(task => ({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: task.type || 'custom',
      title: task.title,
      description: task.reason || '',
      interval_hours: task.interval_hours || 24,
      last_done: null,
      next_due: new Date(now.getTime() + (task.interval_hours || 24) * 3600000).toISOString(),
      priority: task.priority || 'medium',
      auto_remind: true,
      ai_generated: true,
    }));

    const currentTasks = diary?.grow_plan?.tasks || [];
    const updatedTasks = [...currentTasks, ...newTasks];
    const updatedPlan = { ...diary?.grow_plan, tasks: updatedTasks };

    try {
      await base44.entities.GrowDiary.update(diary.id, { grow_plan: updatedPlan });
      setAddedIds(new Set(suggestions.map(s => s.id)));
      onTasksAdded?.({ ...diary, grow_plan: updatedPlan });
      toast.success(`${newTasks.length} Aufgaben zum Plan hinzugefügt!`);
    } catch {
      toast.error('Fehler beim Hinzufügen');
    }
  }, [diary, suggestions, addedIds, onTasksAdded]);

  return (
    <div className="space-y-3">
      {/* Header + Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">KI-Aufgabenberater</p>
            <p className="text-[11px] text-zinc-500">Proaktive Empfehlungen basierend auf deinen Daten</p>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateSuggestions}
        disabled={isGenerating}
        className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:border-purple-500/50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysiere Grow-Daten…
          </>
        ) : (
          <>
            <Brain className="w-4 h-4" />
            {hasGenerated ? 'Neue Vorschläge generieren' : 'KI-Aufgaben vorschlagen lassen'}
          </>
        )}
      </button>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Vorschläge ({suggestions.length})
              </p>
              {suggestions.some(s => !addedIds.has(s.id)) && (
                <button
                  onClick={handleAddAll}
                  className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Alle hinzufügen
                </button>
              )}
            </div>

            {suggestions.map(task => (
              <SuggestedTaskCard
                key={task.id}
                task={task}
                onAdd={handleAddTask}
                added={addedIds.has(task.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No data hint */}
      {!hasGenerated && !isGenerating && (!entries || entries.length === 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              Trage zuerst Einträge mit Temperatur, Feuchtigkeit und Beobachtungen ein — so kann die KI bessere Vorschläge machen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}