import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SPOT_TYPES = [
  { key: 'smoke_spot', icon: '🌿', label: 'Smoke Spot' },
  { key: 'meetup', icon: '🤝', label: 'Meetup-Ort' },
  { key: 'scenic', icon: '🏞️', label: 'Scenic Spot' },
  { key: 'chill_zone', icon: '😌', label: 'Chill Zone' },
  { key: 'grow_shop_tip', icon: '🌱', label: 'Shop-Tipp' },
  { key: 'other', icon: '📍', label: 'Sonstiges' },
];

export default function AddCommunitySpot({ isOpen, onClose, mapCenter, onSpotAdded }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    spot_type: 'smoke_spot',
    latitude: mapCenter?.[0] || 0,
    longitude: mapCenter?.[1] || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) { toast.error('Name ist Pflicht'); return; }
    setSaving(true);
    try {
      const spot = await base44.entities.CommunitySpot.create({
        ...form,
        status: 'approved', // auto-approve for now
        avg_rating: 0,
        ratings: [],
        upvotes: [],
        tags: [],
      });
      toast.success('Spot hinzugefügt! 📍');
      onSpotAdded?.(spot);
      onClose();
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onSpotAdded]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1002] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full max-w-md bg-zinc-900 rounded-t-3xl md:rounded-3xl border-t md:border border-zinc-800 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-400" /> Community-Spot
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Spot-Name"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-green-500/50"
        />

        <div className="grid grid-cols-3 gap-2">
          {SPOT_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setForm(prev => ({ ...prev, spot_type: t.key }))}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                form.spot_type === t.key
                  ? 'bg-green-500/20 border-green-500/40 text-white'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <p className="text-[10px] mt-1 font-medium">{t.label}</p>
            </button>
          ))}
        </div>

        <textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Beschreibung (optional)"
          rows={2}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-green-500/50"
        />

        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 p-3 rounded-xl">
          <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>Position: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 bg-green-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Spot vorschlagen
        </button>
      </motion.div>
    </motion.div>
  );
}