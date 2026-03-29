import { useEffect, useState } from "react";
import { GrowDiaryEntry } from "@/entities/GrowDiaryEntry";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function DiaryDetailModal({ data }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!data?.id) return;
    GrowDiaryEntry.filter({ diary_id: data.id }, "-day_number").then(setEntries).catch(() => setEntries([]));
  }, [data?.id]);

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-white text-xl font-bold mb-3">{data?.name}</h3>
      <p className="text-zinc-400 text-sm mb-4">Strain: {data?.strain_name}</p>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
            <div className="flex items-center justify-between text-zinc-300 text-sm">
              <span>Tag {e.day_number} • {e.growth_stage}</span>
              <span className="text-zinc-500">Woche {e.week_number || "-"}</span>
            </div>
            {e.media_urls?.[0] && (
              <div className="w-full aspect-video rounded-lg overflow-hidden mt-2">
                <ImageWithFallback src={e.media_urls[0]} alt="Eintrag" className="w-full h-full object-cover" />
              </div>
            )}
            {e.plant_observation && <p className="text-zinc-200 mt-2">{e.plant_observation}</p>}
          </div>
        ))}
        {entries.length === 0 && <div className="text-zinc-400">Keine Einträge vorhanden.</div>}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm">Analyse</button>
        <button className="px-4 py-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm">Exportieren</button>
      </div>
    </div>
  );
}