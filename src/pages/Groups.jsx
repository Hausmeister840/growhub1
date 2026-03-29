import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, allGroups] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Group.list()
      ]);

      setCurrentUser(user);
      setGroups(allGroups || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade Gruppen...</p>
        </div>
      </div>
    );
  }

  const handleCreateGroup = () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }
    navigate(createPageUrl('CreateGroup'));
  };

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Noch keine Gruppen</h2>
          <p className="text-zinc-400 mb-2">
            Erstelle eine Gruppe und tausche dich mit Gleichgesinnten aus!
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            💬 Diskutiere über Grows • 🌱 Teile Tipps • 🤝 Vernetze dich
          </p>
          <Button
            onClick={handleCreateGroup}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Gruppe erstellen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gruppen</h1>
                <p className="text-xs text-zinc-400">{groups.length} verfügbar</p>
              </div>
            </div>
            {currentUser && (
              <Button
                onClick={handleCreateGroup}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Erstellen
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {groups.map((group) => (
          <motion.button
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(createPageUrl(`GroupDetail?id=${group.id}`))}
            className="w-full bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-4 transition-all text-left border border-zinc-800"
          >
            <div className="flex items-center gap-4">
              {group.cover_image_url ? (
                <img src={group.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Users className="w-8 h-8 text-zinc-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate">{group.name}</h3>
                <p className="text-sm text-zinc-400 truncate">{group.description}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {group.members?.length || 0} Mitglieder
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}