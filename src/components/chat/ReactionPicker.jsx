
const QUICK_REACTIONS = ['🔥', '🌿', '❤️', '😂', '👍', '🙏', '💯', '✨'];

export default function ReactionPicker({ onSelect, onClose }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-zinc-800 rounded-full px-2 py-1 shadow-xl border border-zinc-700 flex gap-1">
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors text-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}