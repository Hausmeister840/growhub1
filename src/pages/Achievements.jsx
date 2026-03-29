import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, Flame, Sprout, Heart, MessageCircle, Users,
  Camera, Award, Target, Zap, Crown, Lock, CheckCircle, Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ALL_ACHIEVEMENTS = [
  // Social
  { id: 'first_post', name: 'Erster Post', desc: 'Veröffentliche deinen ersten Post', icon: Camera, xp: 50, category: 'social' },
  { id: 'influencer', name: 'Influencer', desc: 'Erreiche 100 Follower', icon: Users, xp: 200, category: 'social', target: 100 },
  { id: 'viral', name: 'Viral', desc: 'Erhalte 100 Likes auf einen Post', icon: Heart, xp: 150, category: 'social', target: 100 },
  { id: 'social_butterfly', name: 'Social Butterfly', desc: 'Folge 50 Nutzern', icon: Users, xp: 100, category: 'social', target: 50 },
  { id: 'commenter', name: 'Kommentator', desc: 'Schreibe 50 Kommentare', icon: MessageCircle, xp: 75, category: 'social', target: 50 },
  
  // Growing
  { id: 'first_grow', name: 'Erster Grow', desc: 'Starte dein erstes Grow-Tagebuch', icon: Sprout, xp: 100, category: 'growing' },
  { id: 'green_thumb', name: 'Grüner Daumen', desc: 'Schließe 5 Grows erfolgreich ab', icon: Sprout, xp: 500, category: 'growing', target: 5 },
  { id: 'master_grower', name: 'Master Grower', desc: 'Schließe 20 Grows ab', icon: Crown, xp: 1000, category: 'growing', target: 20 },
  { id: 'consistent', name: 'Konsistent', desc: 'Logge 30 Tage am Stück', icon: Flame, xp: 300, category: 'growing', target: 30 },
  { id: 'photographer', name: 'Fotograf', desc: 'Lade 100 Fotos hoch', icon: Camera, xp: 200, category: 'growing', target: 100 },
  
  // Community
  { id: 'helper', name: 'Helfer', desc: 'Erhalte 50 hilfreiche Reaktionen', icon: Star, xp: 150, category: 'community', target: 50 },
  { id: 'group_leader', name: 'Gruppenleiter', desc: 'Erstelle eine Gruppe', icon: Users, xp: 100, category: 'community' },
  { id: 'event_host', name: 'Eventveranstalter', desc: 'Erstelle ein Event', icon: Target, xp: 100, category: 'community' },
  { id: 'knowledge_sharer', name: 'Wissensteiler', desc: 'Schreibe einen Wissensartikel', icon: Award, xp: 200, category: 'community' },
  
  // Streaks & Activity
  { id: 'streak_7', name: '7-Tage-Streak', desc: 'Sei 7 Tage aktiv', icon: Flame, xp: 100, category: 'activity', target: 7 },
  { id: 'streak_30', name: '30-Tage-Streak', desc: 'Sei 30 Tage aktiv', icon: Flame, xp: 500, category: 'activity', target: 30 },
  { id: 'streak_100', name: '100-Tage-Streak', desc: 'Sei 100 Tage aktiv', icon: Crown, xp: 1500, category: 'activity', target: 100 },
  { id: 'early_bird', name: 'Early Bird', desc: 'Melde dich vor 7 Uhr an', icon: Zap, xp: 50, category: 'activity' },
  { id: 'night_owl', name: 'Nachteule', desc: 'Melde dich nach Mitternacht an', icon: Zap, xp: 50, category: 'activity' }
];

const CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'social', label: 'Social' },
  { id: 'growing', label: 'Growing' },
  { id: 'community', label: 'Community' },
  { id: 'activity', label: 'Aktivität' }
];

export default function Achievements() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch {
      toast.error('Bitte melde dich an');
    } finally {
      setIsLoading(false);
    }
  };

  const userAchievements = currentUser?.achievements || [];
  const totalXP = currentUser?.xp || 0;
  const level = Math.floor(totalXP / 100) + 1;

  const filteredAchievements = selectedCategory === 'all' 
    ? ALL_ACHIEVEMENTS 
    : ALL_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const unlockedCount = userAchievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-gradient-to-b from-purple-500/20 to-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Achievements</h1>
              <p className="text-sm text-zinc-400">{unlockedCount} von {totalCount} freigeschaltet</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-400">{totalXP}</p>
              <p className="text-xs text-zinc-500">XP (Level {level})</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Fortschritt</span>
              <span className="text-white font-bold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {filteredAchievements.map((achievement, idx) => {
            const isUnlocked = userAchievements.includes(achievement.id);
            const Icon = achievement.icon;

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30'
                    : 'bg-zinc-900/50 border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isUnlocked 
                      ? 'bg-purple-500/20' 
                      : 'bg-zinc-800'
                  }`}>
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  {isUnlocked && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                  {achievement.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-2">{achievement.desc}</p>
                
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${isUnlocked ? 'text-yellow-500' : 'text-zinc-600'}`} />
                  <span className={`text-sm font-bold ${isUnlocked ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    +{achievement.xp} XP
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}