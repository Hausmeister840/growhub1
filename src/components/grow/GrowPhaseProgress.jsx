import { motion } from 'framer-motion';

const PHASES = [
  { id: 'Keimung', emoji: '🌱', label: 'Keimung' },
  { id: 'Sämling', emoji: '🌿', label: 'Sämling' },
  { id: 'Wachstum', emoji: '🌳', label: 'Wachstum' },
  { id: 'Blüte', emoji: '🌸', label: 'Blüte' },
  { id: 'Spülung', emoji: '💧', label: 'Spülung' },
  { id: 'Ernte', emoji: '🏆', label: 'Ernte' }
];

export default function GrowPhaseProgress({ currentStage, onStageChange, editable = false }) {
  const currentIndex = PHASES.findIndex(p => p.id === currentStage);
  const progress = currentIndex >= 0 ? (currentIndex / (PHASES.length - 1)) * 100 : 0;

  return (
    <div className="px-4 py-4 bg-zinc-900/50 border-b border-zinc-800/50">
      {/* Progress line */}
      <div className="relative mx-5 mb-3">
        <div className="h-[2px] bg-zinc-800 rounded-full" />
        <motion.div
          className="absolute top-0 h-[2px] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Phase nodes */}
      <div className="flex justify-between items-start">
        {PHASES.map((phase, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = phase.id === currentStage;
          
          return (
            <button
              key={phase.id}
              onClick={() => editable && onStageChange?.(phase.id)}
              disabled={!editable}
              className={`flex flex-col items-center gap-1 transition-all ${editable ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
            >
              <motion.div 
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-base transition-all
                  ${isCurrent 
                    ? 'bg-green-500/20 ring-2 ring-green-500 scale-110' 
                    : isActive 
                      ? 'bg-zinc-800' 
                      : 'bg-zinc-900 opacity-40'}
                `}
                animate={isCurrent ? { 
                  boxShadow: [
                    '0 0 0px rgba(34,197,94,0.2)', 
                    '0 0 14px rgba(34,197,94,0.35)', 
                    '0 0 0px rgba(34,197,94,0.2)'
                  ]
                } : {}}
                transition={isCurrent ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {phase.emoji}
              </motion.div>
              <span className={`text-[8px] font-semibold leading-tight text-center max-w-[40px] ${
                isCurrent ? 'text-green-400' : isActive ? 'text-zinc-500' : 'text-zinc-700'
              }`}>
                {phase.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}