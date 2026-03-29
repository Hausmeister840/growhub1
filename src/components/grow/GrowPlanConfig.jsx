/**
 * Default grow plans per stage + grow method.
 * Used as fallback when AI plan isn't generated yet.
 */

export const DEFAULT_PLANS = {
  Keimung: {
    watering: { interval_hours: 24, amount_ml: 50, ph_target: 6.0, notes: 'Nur leicht feucht halten, kein Ertränken' },
    feeding: { interval_days: 0, ec_target: 0, npk_ratio: '—', notes: 'Keine Nährstoffe nötig' },
    lighting: { hours_on: 18, hours_off: 6, ppfd_target: 150, notes: 'Sanftes Licht, 40–60cm Abstand' },
    environment: { temp_min: 22, temp_max: 28, humidity_min: 70, humidity_max: 90, notes: 'Dome/Abdeckung für hohe Feuchte' },
  },
  Sämling: {
    watering: { interval_hours: 24, amount_ml: 100, ph_target: 6.0, notes: 'Gießen wenn Erde leicht trocken' },
    feeding: { interval_days: 7, ec_target: 0.6, npk_ratio: '2-1-2', notes: '¼ Dosis Grow-Dünger' },
    lighting: { hours_on: 18, hours_off: 6, ppfd_target: 300, notes: '30–40cm Abstand' },
    environment: { temp_min: 20, temp_max: 25, humidity_min: 60, humidity_max: 70, notes: 'Dome entfernen wenn echte Blätter da sind' },
  },
  Wachstum: {
    watering: { interval_hours: 48, amount_ml: 500, ph_target: 6.2, notes: 'Gründlich gießen, Drainage abwarten' },
    feeding: { interval_days: 3, ec_target: 1.4, npk_ratio: '3-1-2', notes: 'Volle Dosis Wachstumsdünger' },
    lighting: { hours_on: 18, hours_off: 6, ppfd_target: 500, notes: '20–30cm Abstand' },
    environment: { temp_min: 20, temp_max: 28, humidity_min: 40, humidity_max: 60, notes: 'Gute Luftzirkulation' },
  },
  Blüte: {
    watering: { interval_hours: 48, amount_ml: 800, ph_target: 6.3, notes: 'Regelmäßig, nicht überwässern' },
    feeding: { interval_days: 2, ec_target: 1.6, npk_ratio: '1-3-3', notes: 'Blütedünger + PK-Booster ab Woche 4' },
    lighting: { hours_on: 12, hours_off: 12, ppfd_target: 700, notes: 'KEIN Licht in Dunkelphase!' },
    environment: { temp_min: 18, temp_max: 26, humidity_min: 40, humidity_max: 50, notes: 'Niedrige Feuchte gegen Schimmel' },
  },
  Spülung: {
    watering: { interval_hours: 36, amount_ml: 1000, ph_target: 6.0, notes: 'Nur reines pH-Wasser, viel Drainage' },
    feeding: { interval_days: 0, ec_target: 0, npk_ratio: '—', notes: 'KEINE Nährstoffe mehr' },
    lighting: { hours_on: 12, hours_off: 12, ppfd_target: 600, notes: 'Wie Blüte weiterfahren' },
    environment: { temp_min: 18, temp_max: 24, humidity_min: 40, humidity_max: 50, notes: 'Trichome täglich prüfen' },
  },
  Ernte: {
    watering: { interval_hours: 0, amount_ml: 0, ph_target: 0, notes: 'Letztes Gießen 1–2 Tage vor Ernte stoppen' },
    feeding: { interval_days: 0, ec_target: 0, npk_ratio: '—', notes: '—' },
    lighting: { hours_on: 0, hours_off: 24, ppfd_target: 0, notes: '48h Dunkelheit vor Schnitt (optional)' },
    environment: { temp_min: 15, temp_max: 21, humidity_min: 45, humidity_max: 55, notes: 'Trocknungsraum vorbereiten' },
  },
};

/**
 * Create default tasks for a stage
 */
export function createDefaultTasks(stage, growMethod) {
  const plan = DEFAULT_PLANS[stage];
  if (!plan) return [];

  const now = new Date();
  const tasks = [];

  // Watering task
  if (plan.watering.interval_hours > 0) {
    tasks.push({
      id: `water_${Date.now()}`,
      type: 'watering',
      title: '💧 Gießen',
      description: `${plan.watering.amount_ml}ml, pH ${plan.watering.ph_target}`,
      interval_hours: plan.watering.interval_hours,
      last_done: null,
      next_due: new Date(now.getTime() + plan.watering.interval_hours * 3600000).toISOString(),
      priority: 'high',
      auto_remind: true,
    });
  }

  // Feeding task
  if (plan.feeding.interval_days > 0) {
    tasks.push({
      id: `feed_${Date.now()}`,
      type: 'feeding',
      title: '🧪 Düngen',
      description: `EC ${plan.feeding.ec_target}, NPK ${plan.feeding.npk_ratio}`,
      interval_hours: plan.feeding.interval_days * 24,
      last_done: null,
      next_due: new Date(now.getTime() + plan.feeding.interval_days * 86400000).toISOString(),
      priority: 'medium',
      auto_remind: true,
    });
  }

  // Light check (daily)
  tasks.push({
    id: `light_${Date.now()}`,
    type: 'lighting',
    title: '☀️ Licht prüfen',
    description: `${plan.lighting.hours_on}h an / ${plan.lighting.hours_off}h aus, ${plan.lighting.ppfd_target} PPFD`,
    interval_hours: 24,
    last_done: null,
    next_due: new Date(now.getTime() + 86400000).toISOString(),
    priority: 'medium',
    auto_remind: true,
  });

  // Environment check (daily)
  tasks.push({
    id: `env_${Date.now()}`,
    type: 'environment',
    title: '🌡️ Umgebung prüfen',
    description: `${plan.environment.temp_min}–${plan.environment.temp_max}°C, ${plan.environment.humidity_min}–${plan.environment.humidity_max}% rH`,
    interval_hours: 12,
    last_done: null,
    next_due: new Date(now.getTime() + 43200000).toISOString(),
    priority: 'low',
    auto_remind: true,
  });

  return tasks;
}

export const TASK_ICONS = {
  watering: '💧',
  feeding: '🧪',
  lighting: '☀️',
  environment: '🌡️',
  training: '✂️',
  inspection: '🔍',
  custom: '📝',
};

export const TASK_COLORS = {
  watering: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500/30' },
  feeding: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', ring: 'ring-purple-500/30' },
  lighting: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', ring: 'ring-yellow-500/30' },
  environment: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', ring: 'ring-orange-500/30' },
  training: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', ring: 'ring-green-500/30' },
  inspection: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', ring: 'ring-cyan-500/30' },
  custom: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', ring: 'ring-zinc-500/30' },
};