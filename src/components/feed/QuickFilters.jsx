import React from "react";

export default function QuickFilters({ value = {}, onChange, stats = {}, className = "" }) {
  const [local, setLocal] = React.useState(value || { videos: false, images: false, polls: false });

  React.useEffect(() => {
    setLocal(value || { videos: false, images: false, polls: false });
  }, [value]);

  // ✅ FIXED: Ensure onChange is a function before calling
  const toggle = (key) => {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    
    // Safety check for onChange function
    if (onChange && typeof onChange === 'function') {
      onChange(next);
    } else {
      console.warn("QuickFilters: onChange prop is not a function", { onChange });
    }
  };

  const chip = (label, key, count, color) => (
    <button
      key={key}
      type="button"
      onClick={() => toggle(key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        local[key]
          ? `${color.activeBg} ${color.activeText} border-transparent`
          : "bg-zinc-900/50 text-zinc-300 border-zinc-700 hover:bg-zinc-800/70"
      }`}
      aria-pressed={local[key]}
    >
      {label}
      {typeof count === "number" && <span className="ml-1 text-zinc-400">({count})</span>}
    </button>
  );

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chip("Videos", "videos", stats.videos, { activeBg: "bg-purple-500/20", activeText: "text-purple-300" })}
      {chip("Bilder", "images", stats.images, { activeBg: "bg-blue-500/20", activeText: "text-blue-300" })}
      {chip("Umfragen", "polls", stats.polls, { activeBg: "bg-green-500/20", activeText: "text-green-300" })}
    </div>
  );
}