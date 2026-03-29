
const QUICK_ACTIONS = [
  { id: 'watered', emoji: '💧', label: 'Gegossen' },
  { id: 'fertilized', emoji: '🧪', label: 'Gedüngt' },
  { id: 'repotted', emoji: '🪴', label: 'Umgetopft' },
  { id: 'topped', emoji: '✂️', label: 'Getoppt' },
  { id: 'lst', emoji: '🔗', label: 'LST' },
  { id: 'defoliated', emoji: '🍃', label: 'Entlaubt' },
  { id: 'flower_start', emoji: '🌸', label: 'Blütebeginn' },
  { id: 'problem', emoji: '⚠️', label: 'Problem' },
  { id: 'harvest', emoji: '🏆', label: 'Ernte' },
  { id: 'other', emoji: '📝', label: 'Sonstiges' },
];

export default function QuickActionChips({ selected = [], onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(a => a !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">Was hast du gemacht?</label>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const isActive = selected.includes(action.id);
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => toggle(action.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40 shadow-sm shadow-green-500/10'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}