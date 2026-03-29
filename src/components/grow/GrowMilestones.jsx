
import React, { useMemo } from 'react';
import { motion } from 'framer-motion'; // AnimatePresence removed as it's not used
import { 
  CheckCircle2, Circle, AlertCircle, Lightbulb, 
  Calendar, Sprout, Droplets, TrendingUp,
  Target, Award
} from 'lucide-react';

const MILESTONE_DEFINITIONS = [
  {
    id: 'germination',
    name: 'Keimung abgeschlossen',
    stage: 'Keimung',
    day_range: [1, 7],
    icon: Sprout,
    color: 'from-yellow-500 to-amber-600',
    auto_detect: (entries) => entries.some(e => e.growth_stage === 'Sämling')
  },
  {
    id: 'first_true_leaves',
    name: 'Erste echte Blätter',
    stage: 'Sämling',
    day_range: [7, 14],
    icon: Sprout,
    color: 'from-lime-500 to-green-600',
    auto_detect: (entries) => entries.some(e => 
      e.growth_stage === 'Sämling' && e.plant_observation?.toLowerCase().includes('blät')
    )
  },
  {
    id: 'vegetative_growth',
    name: 'Vegetative Phase begonnen',
    stage: 'Wachstum',
    day_range: [14, 21],
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    auto_detect: (entries) => entries.some(e => e.growth_stage === 'Wachstum')
  },
  {
    id: 'topping',
    name: 'Topping durchgeführt',
    stage: 'Wachstum',
    day_range: [21, 35],
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    auto_detect: (entries) => entries.some(e => 
      e.actions_taken?.some(a => a.toLowerCase().includes('topping'))
    )
  },
  {
    id: 'pre_flowering',
    name: 'Pre-Flowering (12/12)',
    stage: 'Blüte',
    day_range: [35, 50],
    icon: Calendar,
    color: 'from-purple-500 to-pink-600',
    auto_detect: (entries) => entries.some(e => 
      e.growth_stage === 'Blüte' || e.environment_data?.light_schedule?.includes('12/12')
    )
  },
  {
    id: 'flowering_peak',
    name: 'Blüte-Hauptphase',
    stage: 'Blüte',
    day_range: [50, 70],
    icon: Award,
    color: 'from-pink-500 to-rose-600',
    auto_detect: (entries) => {
      const floweringEntries = entries.filter(e => e.growth_stage === 'Blüte');
      return floweringEntries.length > 10;
    }
  },
  {
    id: 'flushing',
    name: 'Spülung begonnen',
    stage: 'Spülung',
    day_range: [70, 80],
    icon: Droplets,
    color: 'from-blue-500 to-cyan-600',
    auto_detect: (entries) => entries.some(e => e.growth_stage === 'Spülung')
  },
  {
    id: 'harvest',
    name: 'Ernte! 🎉',
    stage: 'Ernte',
    day_range: [80, 100],
    icon: Award,
    color: 'from-orange-500 to-red-600',
    auto_detect: (entries) => entries.some(e => e.growth_stage === 'Ernte')
  }
];

const SMART_RECOMMENDATIONS = [
  {
    id: 'temp_high',
    condition: (entries) => {
      const recent = entries.slice(-3);
      const avgTemp = recent.reduce((sum, e) => sum + (e.environment_data?.temp_c || 0), 0) / recent.length;
      return avgTemp > 28;
    },
    message: 'Temperatur zu hoch',
    suggestion: 'Erhöhe die Belüftung oder reduziere die Lichtintensität. Ideal sind 21-26°C.',
    priority: 'high',
    icon: AlertCircle,
    color: 'text-red-400'
  },
  {
    id: 'temp_low',
    condition: (entries) => {
      const recent = entries.slice(-3);
      const avgTemp = recent.reduce((sum, e) => sum + (e.environment_data?.temp_c || 0), 0) / recent.length;
      return avgTemp < 18 && avgTemp > 0;
    },
    message: 'Temperatur zu niedrig',
    suggestion: 'Sorge für mehr Wärme. Prüfe Heizung oder verringere die Belüftung nachts.',
    priority: 'medium',
    icon: AlertCircle,
    color: 'text-blue-400'
  },
  {
    id: 'humidity_high',
    condition: (entries) => {
      const recent = entries.slice(-3);
      const avgHum = recent.reduce((sum, e) => sum + (e.environment_data?.humidity_rh || 0), 0) / recent.length;
      return avgHum > 70;
    },
    message: 'Luftfeuchtigkeit zu hoch',
    suggestion: 'Erhöhe Luftzirkulation um Schimmelbildung zu vermeiden. Ziel: 40-60%.',
    priority: 'high',
    icon: AlertCircle,
    color: 'text-orange-400'
  },
  {
    id: 'ready_for_topping',
    condition: (entries) => {
      const latest = entries[entries.length - 1];
      return latest?.day_number >= 21 && 
             latest?.growth_stage === 'Wachstum' && 
             !entries.some(e => e.actions_taken?.some(a => a.toLowerCase().includes('topping')));
    },
    message: 'Bereit für Topping',
    suggestion: 'Deine Pflanze ist stark genug. Topping fördert buschiges Wachstum und mehr Buds!',
    priority: 'medium',
    icon: Lightbulb,
    color: 'text-green-400'
  },
  {
    id: 'switch_to_flowering',
    condition: (entries) => {
      const latest = entries[entries.length - 1];
      return latest?.day_number >= 35 && 
             latest?.growth_stage === 'Wachstum' &&
             latest?.plant_height_cm >= 30;
    },
    message: 'Bereit für Blütephase',
    suggestion: 'Deine Pflanze ist groß genug. Wechsle zu 12/12 Lichtzyklus um die Blüte einzuleiten!',
    priority: 'medium',
    icon: Calendar,
    color: 'text-purple-400'
  },
  {
    id: 'harvest_soon',
    condition: (entries) => {
      const latest = entries[entries.length - 1];
      const floweringDays = entries.filter(e => e.growth_stage === 'Blüte').length;
      return floweringDays >= 50 && latest?.growth_stage === 'Blüte';
    },
    message: 'Ernte naht!',
    suggestion: 'Prüfe die Trichome mit einer Lupe. Bei 70% milchig-weiß ist der perfekte Zeitpunkt!',
    priority: 'high',
    icon: Award,
    color: 'text-orange-400'
  }
];

export default function GrowMilestones({ diary, entries }) {
  // ✅ Erreichte Meilensteine ermitteln
  const achievedMilestones = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    return MILESTONE_DEFINITIONS.filter(milestone => 
      milestone.auto_detect(entries)
    ).map(m => ({
      ...m,
      achieved_date: entries.find(e => 
        m.auto_detect([e])
      )?.entry_date || new Date().toISOString()
    }));
  }, [entries]);

  // ✅ Nächster Meilenstein
  const nextMilestone = useMemo(() => {
    const currentDay = entries.length > 0 ? 
      Math.max(...entries.map(e => e.day_number || 0)) : 0;
    
    return MILESTONE_DEFINITIONS.find(m => 
      !achievedMilestones.some(am => am.id === m.id) &&
      currentDay >= m.day_range[0] - 5
    );
  }, [entries, achievedMilestones]);

  // ✅ Aktive Empfehlungen
  const activeRecommendations = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    return SMART_RECOMMENDATIONS.filter(rec => rec.condition(entries));
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* 🎯 AKTIVE EMPFEHLUNGEN */}
      {activeRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 border border-green-500/30 bg-green-500/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Intelligente Empfehlungen</h3>
              <p className="text-sm text-zinc-400">KI-gestützte Tipps für deinen Grow</p>
            </div>
          </div>

          <div className="space-y-3">
            {activeRecommendations.map(rec => {
              const IconComponent = rec.icon;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-2xl border ${
                    rec.priority === 'high' ? 'border-red-500/30 bg-red-500/5' :
                    rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={`w-5 h-5 ${rec.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{rec.message}</h4>
                      <p className="text-sm text-zinc-300">{rec.suggestion}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 🏆 MEILENSTEINE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-6 border border-zinc-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Meilensteine</h3>
              <p className="text-sm text-zinc-400">
                {achievedMilestones.length} von {MILESTONE_DEFINITIONS.length} erreicht
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {Math.round((achievedMilestones.length / MILESTONE_DEFINITIONS.length) * 100)}%
            </div>
            <div className="text-xs text-zinc-400">Fortschritt</div>
          </div>
        </div>

        {/* Fortschrittsbalken */}
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(achievedMilestones.length / MILESTONE_DEFINITIONS.length) * 100}%` 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>

        {/* Nächster Meilenstein Highlight */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 mb-4"
          >
            <div className="flex items-center gap-3">
              {React.createElement(nextMilestone.icon, { 
                className: "w-6 h-6 text-purple-400" 
              })}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">Nächster Meilenstein:</h4>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    Tag {nextMilestone.day_range[0]}-{nextMilestone.day_range[1]}
                  </span>
                </div>
                <p className="text-zinc-300 mt-1">{nextMilestone.name}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Liste aller Meilensteine */}
        <div className="space-y-2">
          {MILESTONE_DEFINITIONS.map((milestone, index) => {
            const isAchieved = achievedMilestones.some(am => am.id === milestone.id);
            const IconComponent = milestone.icon;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isAchieved 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-zinc-800/30 border border-zinc-700/30'
                }`}
              >
                {isAchieved ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-zinc-600 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <div className="font-semibold text-white">{milestone.name}</div>
                  <div className="text-xs text-zinc-400">
                    Tag {milestone.day_range[0]}-{milestone.day_range[1]} • {milestone.stage}
                  </div>
                </div>

                {isAchieved && (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${milestone.color} flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
