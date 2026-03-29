import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Lock, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'grow', label: 'Grow' },
  { value: 'strains', label: 'Strains' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'region', label: 'Regional' },
  { value: 'clubs', label: 'Clubs' },
];

export default function CreateSpaceModal({ isOpen, onClose, onCreated, currentUser }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('grow');
  const [visibility, setVisibility] = useState('public');
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.CommunitySpace.create({
        name: name.trim(),
        description: description.trim(),
        category,
        visibility,
        geo_enabled: geoEnabled,
        owner_email: currentUser.email,
        moderators: [currentUser.email],
        members: [currentUser.email],
        member_count: 1,
        post_count: 0,
        is_trending: false,
        last_activity: new Date().toISOString()
      });

      toast.success('Space erstellt!');
      onCreated();
    } catch (err) {
      console.error('Create space error:', err);
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Space erstellen</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Space Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Indoor Grow Germany"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Beschreibung (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in diesem Space?"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-500 resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Kategorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat.value
                      ? 'bg-green-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Sichtbarkeit</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  visibility === 'public'
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                Öffentlich
              </button>
              <button
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  visibility === 'private'
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                Privat
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Erstelle...' : 'Space erstellen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}