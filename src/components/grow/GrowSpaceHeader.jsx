import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GrowSpaceHeader({ searchQuery, onSearchChange, onCreateDiary }) {
  return (
    <div className="sticky top-14 lg:top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🌱 GrowSpace
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Deine Grows verwalten & tracken</p>
          </div>
          <Button
            onClick={onCreateDiary}
            className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl"
          >
            <Plus className="w-5 h-5 mr-1" />
            Neuer Grow
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Grow suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}