import { motion } from 'framer-motion';

const LEVELS = [
  { min: 0, label: 'Beginner Grower', icon: '🌱', color: 'from-green-400/20 to-green-600/20', border: 'border-green-500/30' },
  { min: 100, label: 'Advanced Grower', icon: '🧪', color: 'from-blue-400/20 to-blue-600/20', border: 'border-blue-500/30' },
  { min: 500, label: 'Master Grower', icon: '🔥', color: 'from-orange-400/20 to-orange-600/20', border: 'border-orange-500/30' },
  { min: 1000, label: 'Community Leader', icon: '👑', color: 'from-yellow-400/20 to-yellow-600/20', border: 'border-yellow-500/30' },
];

export function getReputationLevel(xp = 0) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.min) current = lvl;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1];
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100;
  return { ...current, level: idx + 1, progress: Math.min(progress, 100), xp, nextXp: next?.min };
}

export default function ReputationBadge({ xp = 0, size = 'md', showProgress = true }) {
  const rep = getReputationLevel(xp);
  const isSmall = size === 'sm';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 rounded-full border bg-gradient-to-r ${rep.color} ${rep.border} ${
        isSmall ? 'px-2 py-0.5' : 'px-3 py-1.5'
      }`}
    >
      <span className={isSmall ? 'text-sm' : 'text-lg'}>{rep.icon}</span>
      <div className="flex flex-col">
        <span className={`font-bold text-white leading-tight ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
          {rep.label}
        </span>
        {showProgress && !isSmall && rep.nextXp && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-16 h-1 bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rep.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              />
            </div>
            <span className="text-[9px] text-zinc-500">{xp}/{rep.nextXp} XP</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}