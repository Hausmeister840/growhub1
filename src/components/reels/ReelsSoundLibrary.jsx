import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, TrendingUp, Music, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TRENDING_SOUNDS = [
  { id: 1, name: 'Chill Vibes', artist: 'GrowHub', uses: 12543, duration: '0:15' },
  { id: 2, name: 'Growing Strong', artist: 'Cannabis Beats', uses: 9821, duration: '0:20' },
  { id: 3, name: 'Harvest Time', artist: 'Green Sound', uses: 8234, duration: '0:18' },
  { id: 4, name: 'Smoke Session', artist: 'Chill Producer', uses: 7654, duration: '0:22' },
  { id: 5, name: 'Bud Life', artist: 'Plant Music', uses: 6543, duration: '0:16' },
];

export default function ReelsSoundLibrary({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sounds, setSounds] = useState(TRENDING_SOUNDS);

  const filteredSounds = sounds.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/90 flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900 rounded-t-3xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Music className="w-6 h-6 text-green-400" />
            Sound Library
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Sound suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-white text-sm font-bold">Trending Sounds</span>
          </div>

          <div className="space-y-2">
            {filteredSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => {
                  toast.success(`Sound "${sound.name}" ausgewählt!`);
                  onClose();
                }}
                className="w-full p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold text-sm">{sound.name}</h3>
                  <p className="text-zinc-400 text-xs">{sound.artist} • {sound.duration}</p>
                </div>

                <div className="text-right">
                  <p className="text-zinc-400 text-xs">{sound.uses.toLocaleString()} Videos</p>
                  <Play className="w-4 h-4 text-green-400 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-4"
          variant="outline"
        >
          Abbrechen
        </Button>
      </motion.div>
    </motion.div>
  );
}