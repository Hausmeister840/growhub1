
import { motion } from 'framer-motion';
import {
  Calendar, Activity, Camera, Droplet,
  TrendingUp, Thermometer, Droplets
} from 'lucide-react';
// Badge and Progress are no longer used by the updated component, so they are removed.
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';

// ✅ FORMAT HELPER
const formatValue = (value, unit = '', placeholder = 'Nicht gemessen') => {
  if (value === null || value === undefined || value === '-' || value === '' || isNaN(value)) {
    return placeholder;
  }
  // Special handling for water total where it might be in ml but displayed as L for better readability
  if (unit === 'ml' && value >= 1000) {
    return `${(value / 1000).toFixed(1)}L`;
  }
  return `${value}${unit}`;
};

export default function GrowStatsPanel({ stats, diary }) { // diary is still passed but not used in the new component logic
  if (!stats) return null;

  const displayStats = [
    {
      icon: Calendar,
      label: 'Gesamt',
      value: formatValue(stats.total_days, ' Tage', '0 Tage'),
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Activity,
      label: 'Einträge',
      value: formatValue(stats.total_entries, '', '0'),
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Camera,
      label: 'Fotos',
      value: formatValue(stats.total_photos, '', '0'),
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Thermometer,
      label: 'Ø Temp',
      value: formatValue(stats.avg_temp, '°C', 'Nicht gemessen'),
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Droplets, // Note: Using Droplets for average humidity for distinction
      label: 'Ø Luftfeucht.',
      value: formatValue(stats.avg_humidity, '%', 'Nicht gemessen'),
      color: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Droplet, // Note: Using Droplet for total water
      label: 'Wasser gesamt',
      value: formatValue(stats.total_water_ml, 'ml', '0ml'),
      color: 'from-blue-500 to-indigo-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-3xl p-6 border border-zinc-800"
    >
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Statistiken
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {displayStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-zinc-400">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// The following helper components/functions were part of the previous GrowStatsPanel
// and are no longer used in the updated version. Hence, they are removed.

// function StatCard({ icon, label, value, color }) {
//   return (
//     <div className="glass-card rounded-2xl p-4 border border-zinc-800">
//       <div className="flex items-center gap-2 mb-2">
//         <div className={color}>{icon}</div>
//         <span className="text-xs text-zinc-500">{label}</span>
//       </div>
//       <p className="text-xl font-bold text-white">{value}</p>
//     </div>
//   );
// }

// function getHealthMessage(score) {
//   if (score >= 90) return 'Ausgezeichneter Zustand! 🌟';
//   if (score >= 80) return 'Sehr gesund 💚';
//   if (score >= 70) return 'Guter Fortschritt 👍';
//   if (score >= 60) return 'Moderate Probleme 🟡';
//   if (score >= 50) return 'Aufmerksamkeit nötig ⚠️';
//   return 'Sofortmaßnahmen erforderlich! 🚨';
// }

// function estimateTotalGrowDays(stage) {
//   const estimates = {
//     'Keimung': 100,
//     'Sämling': 100,
//     'Wachstum': 100,
//     'Blüte': 130,
//     'Spülung': 140,
//     'Ernte': 150
//   };
//   return estimates[stage] || 100;
// }
