import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DEFAULT_PLANS, TASK_ICONS, TASK_COLORS, createDefaultTasks } from './GrowPlanConfig';
import GrowPlanGenerator from './GrowPlanGenerator';
import AITaskAdvisor from './AITaskAdvisor';

function TaskCard({ task, onComplete }) {
  const now = Date.now();
  const dueDate = task.next_due ? new Date(task.next_due) : null;
  const isOverdue = dueDate && dueDate.getTime() < now;
  const isDueSoon = dueDate && !isOverdue && (dueDate.getTime() - now) < 2 * 3600000; // 2h
  const colors = TASK_COLORS[task.type] || TASK_COLORS.custom;
  const icon = TASK_ICONS[task.type] || '📝';

  const timeLeft = dueDate ? (() => {
    const diff = dueDate.getTime() - now;
    if (diff < 0) {
      const h = Math.floor(Math.abs(diff) / 3600000);
      return h > 24 ? `${Math.floor(h/24)}T überfällig` : `${h}h überfällig`;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `in ${Math.floor(h/24)}T ${h%24}h`;
    if (h > 0) return `in ${h}h ${m}m`;
    return `in ${m}m`;
  })() : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
        isOverdue ? 'bg-red-500/10 border-red-500/30' : isDueSoon ? 'bg-amber-500/8 border-amber-500/25' : `${colors.bg} ${colors.border}`
      }`}
    >
      <div className="text-xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{task.title}</p>
        <p className="text-xs text-zinc-500 truncate">{task.description}</p>
        {timeLeft && (
          <div className={`flex items-center gap-1 mt-1 ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-zinc-500'}`}>
            {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span className="text-[11px] font-medium">{timeLeft}</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onComplete(task)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
          isOverdue ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-green-500 hover:text-black'
        }`}
      >
        <Check className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function PlanOverview({ plan, stage }) {
  const p = plan || DEFAULT_PLANS[stage] || {};

  const items = [
    { icon: '💧', label: 'Gießen', value: p.watering?.interval_hours ? `alle ${p.watering.interval_hours}h` : '—', sub: p.watering?.amount_ml ? `${p.watering.amount_ml}ml · pH ${p.watering.ph_target}` : '' },
    { icon: '🧪', label: 'Düngen', value: p.feeding?.interval_days ? `alle ${p.feeding.interval_days}T` : 'Keine', sub: p.feeding?.ec_target ? `EC ${p.feeding.ec_target} · ${p.feeding.npk_ratio}` : '' },
    { icon: '☀️', label: 'Licht', value: p.lighting?.hours_on ? `${p.lighting.hours_on}/${p.lighting.hours_off}h` : '—', sub: p.lighting?.ppfd_target ? `${p.lighting.ppfd_target} PPFD` : '' },
    { icon: '🌡️', label: 'Klima', value: p.environment?.temp_min ? `${p.environment.temp_min}–${p.environment.temp_max}°C` : '—', sub: p.environment?.humidity_min ? `${p.environment.humidity_min}–${p.environment.humidity_max}% rH` : '' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <div key={item.label} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{item.icon}</span>
            <span className="text-[11px] text-zinc-500 font-medium">{item.label}</span>
          </div>
          <p className="text-sm font-bold text-white">{item.value}</p>
          {item.sub && <p className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export default function GrowPlanDashboard({ diary, entries, onUpdate }) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [completing, setCompleting] = useState(null);

  const plan = diary?.grow_plan || {};
  const tasks = plan.tasks || [];
  const stage = diary?.current_stage || 'Keimung';

  // Sort tasks: overdue first, then by next_due
  const sortedTasks = [...tasks].sort((a, b) => {
    const aTime = a.next_due ? new Date(a.next_due).getTime() : Infinity;
    const bTime = b.next_due ? new Date(b.next_due).getTime() : Infinity;
    return aTime - bTime;
  });

  const overdueTasks = sortedTasks.filter(t => t.next_due && new Date(t.next_due).getTime() < Date.now());
  const upcomingTasks = sortedTasks.filter(t => !t.next_due || new Date(t.next_due).getTime() >= Date.now());

  const handleComplete = useCallback(async (task) => {
    setCompleting(task.id);
    const now = new Date();
    const updatedTasks = tasks.map(t => {
      if (t.id !== task.id) return t;
      return {
        ...t,
        last_done: now.toISOString(),
        next_due: t.interval_hours
          ? new Date(now.getTime() + t.interval_hours * 3600000).toISOString()
          : null,
      };
    });

    try {
      await base44.entities.GrowDiary.update(diary.id, {
        grow_plan: { ...plan, tasks: updatedTasks },
      });
      onUpdate?.({ ...diary, grow_plan: { ...plan, tasks: updatedTasks } });
      toast.success(`${task.title} erledigt!`);
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setCompleting(null);
    }
  }, [diary, plan, tasks, onUpdate]);

  const handleInitializePlan = useCallback(async () => {
    const defaultPlan = DEFAULT_PLANS[stage] || DEFAULT_PLANS.Keimung;
    const newTasks = createDefaultTasks(stage, diary?.grow_method);
    const newPlan = {
      ...defaultPlan,
      generated_at: new Date().toISOString(),
      tasks: newTasks,
    };

    try {
      await base44.entities.GrowDiary.update(diary.id, { grow_plan: newPlan });
      onUpdate?.({ ...diary, grow_plan: newPlan });
      toast.success('Anbauplan erstellt!');
    } catch {
      toast.error('Fehler');
    }
  }, [diary, stage, onUpdate]);

  // No plan yet
  if (!plan.tasks?.length) {
    return (
      <div className="space-y-4">
        <PlanOverview plan={null} stage={stage} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 bg-zinc-900/50 rounded-2xl border border-zinc-800"
        >
          <Zap className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Anbauplan aktivieren</h3>
          <p className="text-xs text-zinc-500 mb-5 max-w-xs mx-auto">
            Erhalte automatische Erinnerungen für Gießen, Düngen und Licht basierend auf Phase & Sorte.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleInitializePlan}
              className="px-5 py-2.5 bg-green-500 text-black font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              Standard-Plan starten
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="px-5 py-2.5 bg-purple-500/15 text-purple-400 font-bold rounded-xl text-sm border border-purple-500/30 active:scale-95 transition-all"
            >
              ✨ KI-Plan
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showGenerator && (
            <GrowPlanGenerator
              diary={diary}
              onClose={() => setShowGenerator(false)}
              onPlanGenerated={(newPlan) => {
                setShowGenerator(false);
                onUpdate?.({ ...diary, grow_plan: newPlan });
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan overview cards */}
      <PlanOverview plan={plan} stage={stage} />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowGenerator(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> KI-Plan aktualisieren
        </button>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Überfällig ({overdueTasks.length})
          </p>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">
            Anstehend ({upcomingTasks.length})
          </p>
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        </div>
      )}

      {/* AI Task Advisor */}
      <AITaskAdvisor
        diary={diary}
        entries={entries}
        onTasksAdded={(updatedDiary) => onUpdate?.(updatedDiary)}
      />

      <AnimatePresence>
        {showGenerator && (
          <GrowPlanGenerator
            diary={diary}
            onClose={() => setShowGenerator(false)}
            onPlanGenerated={(newPlan) => {
              setShowGenerator(false);
              onUpdate?.({ ...diary, grow_plan: newPlan });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}