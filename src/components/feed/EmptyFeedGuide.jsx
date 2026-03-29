import { Button } from '@/components/ui/button';
import { Plus, Users, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyFeedGuide({ currentUser, activeTab }) {
  const handleCreatePost = () => {
    window.dispatchEvent(new Event('openCreatePost'));
  };

  const messages = {
    latest: {
      icon: Plus,
      title: 'Noch keine Posts',
      description: 'Sei der Erste und teile etwas mit der Community!',
      action: 'Ersten Post erstellen'
    },
    for_you: {
      icon: Sparkles,
      title: 'Dein Feed ist leer',
      description: 'Folge anderen Usern, um personalisierte Inhalte zu sehen!',
      action: 'Post erstellen'
    },
    trending: {
      icon: TrendingUp,
      title: 'Noch keine Trends',
      description: 'Erstelle interessante Inhalte, um Trends zu setzen!',
      action: 'Post erstellen'
    },
    videos: {
      icon: Users,
      title: 'Keine Videos gefunden',
      description: 'Lade das erste Video hoch und starte die Community!',
      action: 'Video hochladen'
    }
  };

  const config = messages[activeTab] || messages.latest;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-zinc-600" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {config.title}
      </h2>

      <p className="text-zinc-400 mb-8 max-w-md">
        {config.description}
      </p>

      <Button
        onClick={handleCreatePost}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        <Plus className="w-5 h-5 mr-2" />
        {config.action}
      </Button>
    </motion.div>
  );
}