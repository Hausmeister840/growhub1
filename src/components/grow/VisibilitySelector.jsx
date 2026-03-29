import { Lock, Eye, Share2 } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'private', icon: Lock, label: 'Nur ich', desc: 'Privat im Tagebuch', color: 'text-zinc-400', activeBg: 'bg-zinc-700/50 border-zinc-600' },
  { value: 'profile', icon: Eye, label: 'Profil', desc: 'Im Profil sichtbar', color: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-500/40' },
  { value: 'feed', icon: Share2, label: 'Feed teilen', desc: 'Öffentlich im Feed', color: 'text-green-400', activeBg: 'bg-green-500/15 border-green-500/40' },
];

export default function VisibilitySelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">Sichtbarkeit</label>
      <div className="grid grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                isActive ? option.activeBg : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? option.color : 'text-zinc-500'}`} />
              <span className={`text-xs font-semibold ${isActive ? option.color : 'text-zinc-400'}`}>{option.label}</span>
              <span className="text-[10px] text-zinc-500 leading-tight text-center">{option.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}