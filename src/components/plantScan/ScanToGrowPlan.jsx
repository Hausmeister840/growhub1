import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Check, CheckCheck, AlertTriangle, Leaf, Loader2, Brain, LinkIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PRIORITY_STYLE = {
  urgent: 'bg-red-500/15 border-red-500/30 text-red-400',
  high: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  medium: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  low: 'bg-green-500/15 border-green-500/30 text-green-400',
};

const PRIORITY_LABELS = { urgent: 'Sofort', high: 'Dringend', medium: 'Wichtig', low: 'Normal' };

function detectTaskType(text) {
  const lower = (text || '').toLowerCase();
  if (/gieß|wässe|wasser/.test(lower)) return 'watering';
  if (/düng|nährstoff|feed|ec |npk/.test(lower)) return 'feeding';
  if (/licht|lux|ppfd|lampe/.test(lower)) return 'lighting';
  if (/temp|feuchtig|klima|lüft|vpd/.test(lower)) return 'environment';
  if (/schneid|top|lst|train|beschneid/.test(lower)) return 'training';
  if (/schädling|pest|insekt|milbe|neem|spray/.test(lower)) return 'pest_control';
  return 'custom';
}

function getTypeIcon(type) {
  const icons = { watering: '💧', feeding: '🧪', lighting: '☀️', environment: '🌡️', training: '✂️', pest_control: '🛡️', custom: '📋' };
  return icons[type] || '📋';
}

function ActionTaskCard({ action, index, added, onAdd }) {
  const type = detectTaskType(action.title);
  const pStyle = PRIORITY_STYLE[action.priority] || PRIORITY_STYLE.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`p-3.5 rounded-2xl border transition-all ${added ? 'bg-green-500/8 border-green-500/25' : 'bg-white/[0.03] border-white/[0.08]'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{getTypeIcon(type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-bold text-white">{action.title}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${pStyle}`}>
              {PRIORITY_LABELS[action.priority] || 'Wichtig'}
            </span>
          </div>
          {action.description && (
            <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{action.description}</p>
          )}
          {action.timing && (
            <p className="text-[11px] text-zinc-500 mt-1">⏰ {action.timing}</p>
          )}
        </div>
        <button
          onClick={() => onAdd(action, index)}
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

export default function ScanToGrowPlan({ latestScan, linkedDiary, onRefreshDiary }) {
  const [addedIndices, setAddedIndices] = useState(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState([]);

  const actions = useMemo(() => {
    const raw = latestScan?.action_plan || latestScan?.analysis_result?.action_plan || [];
    return raw.map((a, i) => ({
      ...a,
      title: typeof a === 'string' ? a : a.title || 'Aktion',
      description: typeof a === 'string' ? '' : a.description || '',
      priority: a.priority || 'medium',
    }));
  }, [latestScan]);

  const risks = useMemo(() => {
    return latestScan?.risk_factors || latestScan?.analysis_result?.risk_factors || [];
  }, [latestScan]);

  const allItems = useMemo(() => [...actions, ...aiSuggestions], [actions, aiSuggestions]);

  const buildTask = useCallback((action) => {
    const type = detectTaskType(action.title);
    const intervalHours = action.interval_hours || (action.priority === 'urgent' ? 4 : action.priority === 'high' ? 12 : 24);
    const now = new Date();
    return {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: action.title,
      description: action.description || action.reason || '',
      interval_hours: intervalHours,
      last_done: null,
      next_due: new Date(now.getTime() + intervalHours * 3600000).toISOString(),
      priority: action.priority || 'medium',
      auto_remind: true,
      ai_generated: true,
      source: 'plant_scan',
    };
  }, []);

  const handleAddSingle = useCallback(async (action, index) => {
    if (!linkedDiary?.id) {
      toast.error('Kein Grow-Tagebuch verknüpft');
      return;
    }
    if (addedIndices.has(index)) return;

    const newTask = buildTask(action);
    const currentTasks = linkedDiary.grow_plan?.tasks || [];
    const updatedPlan = { ...linkedDiary.grow_plan, tasks: [...currentTasks, newTask] };

    try {
      await base44.entities.GrowDiary.update(linkedDiary.id, { grow_plan: updatedPlan });
      setAddedIndices(prev => new Set([...prev, index]));
      onRefreshDiary?.({ ...linkedDiary, grow_plan: updatedPlan });
      toast.success(`"${action.title}" zum Grow-Plan hinzugefügt!`);
    } catch {
      toast.error('Fehler beim Hinzufügen');
    }
  }, [linkedDiary, addedIndices, buildTask, onRefreshDiary]);

  const handleAddAll = useCallback(async () => {
    if (!linkedDiary?.id) {
      toast.error('Kein Grow-Tagebuch verknüpft');
      return;
    }

    setIsAddingAll(true);
    const toAdd = allItems.filter((_, i) => !addedIndices.has(i));
    if (!toAdd.length) { setIsAddingAll(false); return; }

    const newTasks = toAdd.map(buildTask);
    const currentTasks = linkedDiary.grow_plan?.tasks || [];
    const updatedPlan = { ...linkedDiary.grow_plan, tasks: [...currentTasks, ...newTasks] };

    try {
      await base44.entities.GrowDiary.update(linkedDiary.id, { grow_plan: updatedPlan });
      setAddedIndices(new Set(allItems.map((_, i) => i)));
      onRefreshDiary?.({ ...linkedDiary, grow_plan: updatedPlan });
      toast.success(`${newTasks.length} Aufgaben zum Grow-Plan hinzugefügt!`);
    } catch {
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setIsAddingAll(false);
    }
  }, [linkedDiary, allItems, addedIndices, buildTask, onRefreshDiary]);

  // Generate AI fix suggestions from risk factors
  const generateAISuggestions = useCallback(async () => {
    if (!risks.length) return;
    setIsGeneratingAI(true);

    const riskText = risks.map(r => {
      const title = typeof r === 'string' ? r : r.title || '';
      const sev = typeof r === 'string' ? '' : r.severity || '';
      return `${title} (${sev})`;
    }).join(', ');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist Cannabis-Anbauexperte. Basierend auf diesen erkannten Problemen einer Pflanzenanalyse, erstelle 3-5 konkrete Lösungsaufgaben die sofort in den Grow-Plan übernommen werden können.

ERKANNTE PROBLEME: ${riskText}

PFLANZE: ${linkedDiary?.strain_name || 'unbekannt'}, Phase: ${linkedDiary?.current_stage || 'unbekannt'}, Methode: ${linkedDiary?.grow_method || 'soil'}

Gib für jede Aufgabe: title (kurz, mit Emoji), description (1-2 Sätze Lösung), priority (urgent/high/medium/low), timing (wann ausführen), interval_hours (Wiederholung in Stunden, 0 wenn einmalig).
Sei KONKRET und PRAKTISCH.`,
        response_json_schema: {
          type: 'object',
          properties: {
            fix_tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string' },
                  timing: { type: 'string' },
                  interval_hours: { type: 'number' },
                }
              }
            }
          }
        },
      });

      setAISuggestions((result?.fix_tasks || []).map((t, i) => ({
        ...t,
        reason: t.description,
      })));
    } catch {
      toast.error('KI-Vorschläge konnten nicht geladen werden');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [risks, linkedDiary]);

  // No diary linked
  if (!linkedDiary?.id) {
    return (
      <div className="text-center py-10 px-4">
        <LinkIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <p className="text-white font-bold text-sm mb-1">Kein Grow-Tagebuch verknüpft</p>
        <p className="text-zinc-500 text-xs">Starte einen Scan über dein Grow-Tagebuch, um Lösungen direkt in den Plan zu integrieren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Lösungen → Grow-Plan</p>
          <p className="text-[11px] text-zinc-500">Erkannte Probleme direkt als Aufgaben übernehmen</p>
        </div>
      </div>

      {/* Linked diary info */}
      <div className="px-3 py-2 rounded-xl bg-green-500/[0.06] border border-green-500/20 flex items-center gap-2">
        <Leaf className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-xs text-green-300 font-medium truncate">{linkedDiary.name} · {linkedDiary.current_stage}</span>
      </div>

      {/* Action items from scan */}
      {allItems.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              Maßnahmen ({allItems.length})
            </p>
            {allItems.some((_, i) => !addedIndices.has(i)) && (
              <button
                onClick={handleAddAll}
                disabled={isAddingAll}
                className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                {isAddingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Alle hinzufügen
              </button>
            )}
          </div>
          {allItems.map((action, i) => (
            <ActionTaskCard
              key={i}
              action={action}
              index={i}
              added={addedIndices.has(i)}
              onAdd={handleAddSingle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <p className="text-zinc-500 text-sm">Keine Maßnahmen aus dem letzten Scan.</p>
        </div>
      )}

      {/* AI Fix Suggestions button */}
      {risks.length > 0 && (
        <button
          onClick={generateAISuggestions}
          disabled={isGeneratingAI}
          className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:border-purple-500/50"
        >
          {isGeneratingAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generiere Lösungsvorschläge…
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              {aiSuggestions.length ? 'Neue Lösungen generieren' : `KI-Lösungen für ${risks.length} Probleme`}
            </>
          )}
        </button>
      )}

      {/* Warning if problems exist but no actions */}
      {risks.length > 0 && actions.length === 0 && aiSuggestions.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-300/80">
              Es wurden {risks.length} Probleme erkannt, aber noch keine konkreten Maßnahmen. Nutze den KI-Button oben, um Lösungsvorschläge zu generieren.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}