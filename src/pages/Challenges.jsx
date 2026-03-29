import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Target, Trophy, Flame, Clock, Star, CheckCircle,
  Users, Camera, Sprout, MessageCircle, Heart, Zap, Loader2,
  Calendar, Gift, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const DAILY_CHALLENGES = [
  { id: 'post', name: 'Posten', desc: 'Erstelle einen Post', icon: Camera, xp: 25, type: 'post', target: 1 },
  { id: 'comment', name: 'Kommentieren', desc: 'Schreibe 3 Kommentare', icon: MessageCircle, xp: 15, type: 'comment', target: 3 },
  { id: 'like', name: 'Liken', desc: 'Like 10 Beiträge', icon: Heart, xp: 10, type: 'like', target: 10 },
  { id: 'grow_log', name: 'Grow-Eintrag', desc: 'Logge deinen Grow', icon: Sprout, xp: 30, type: 'grow_log', target: 1 }
];

const WEEKLY_CHALLENGES = [
  { id: 'social_week', name: 'Social Week', desc: 'Poste jeden Tag', icon: Calendar, xp: 200, target: 7, progress: 0 },
  { id: 'engagement', name: 'Engagement Master', desc: 'Erhalte 50 Reaktionen', icon: Zap, xp: 150, target: 50, progress: 0 },
  { id: 'community', name: 'Community Builder', desc: 'Folge 10 neuen Nutzern', icon: Users, xp: 100, target: 10, progress: 0 }
];

const SPECIAL_CHALLENGES = [
  { id: 'first_harvest', name: 'Erste Ernte', desc: 'Schließe deinen ersten Grow ab', icon: Trophy, xp: 500, special: true },
  { id: 'viral_post', name: 'Viral', desc: 'Erhalte 100 Likes auf einen Post', icon: Star, xp: 300, special: true },
  { id: 'top_grower', name: 'Top Grower', desc: 'Erreiche Top 10 im Leaderboard', icon: Target, xp: 1000, special: true }
];

export default function Challenges() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setStreak(user.streak || 0);

      // Touch streak on page visit
      try {
        const streakResponse = await base44.functions.invoke('streakTouch', {});
        if (streakResponse?.data?.streak !== undefined) {
          setStreak(streakResponse.data.streak);
          
          // Update user object
          if (streakResponse.data.streak > (user.streak || 0)) {
            toast.success(`🔥 ${streakResponse.data.streak} Tage Streak!`, {
              description: 'Du bist heute zum ersten Mal online'
            });
          }
        }
      } catch (streakError) {
        console.error('Streak touch error:', streakError);
      }
    } catch {
      toast.error('Bitte melde dich an');
    } finally {
      setIsLoading(false);
    }
  };

  const completedDaily = currentUser?.daily_challenges_completed || [];
  const completedWeekly = currentUser?.weekly_challenges_completed || [];

  // Calculate time until reset
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilReset = Math.floor((tomorrow - now) / (1000 * 60 * 60));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade Challenges...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <Target className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Melde dich an</h2>
          <p className="text-zinc-400 mb-6">
            Schließe Challenges ab und sammle XP für dein Profil!
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-green-600 hover:bg-green-700"
          >
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-gradient-to-b from-orange-500/20 to-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Challenges</h1>
                <p className="text-sm text-zinc-400">Verdiene XP und Belohnungen</p>
              </div>
            </div>
            
            {/* Streak */}
            <div className="text-center p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-400">{streak}</p>
              <p className="text-xs text-zinc-400">Streak</p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>Reset in {hoursUntilReset}h</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Daily Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Tägliche Challenges
            </h2>
            <span className="text-sm text-zinc-400">
              {completedDaily.length}/{DAILY_CHALLENGES.length}
            </span>
          </div>

          <div className="space-y-3">
            {DAILY_CHALLENGES.map((challenge, idx) => {
              const Icon = challenge.icon;
              const isCompleted = completedDaily.includes(challenge.id);

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? 'bg-green-500/20' : 'bg-zinc-800'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Icon className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                        {challenge.name}
                      </h3>
                      <p className="text-sm text-zinc-400">{challenge.desc}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${isCompleted ? 'text-yellow-500' : 'text-zinc-600'}`} />
                        <span className={`font-bold ${isCompleted ? 'text-yellow-400' : 'text-zinc-500'}`}>
                          +{challenge.xp}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Wöchentliche Challenges
            </h2>
          </div>

          <div className="space-y-3">
            {WEEKLY_CHALLENGES.map((challenge, idx) => {
              const Icon = challenge.icon;
              const progress = Math.min(challenge.progress, challenge.target);
              const progressPercent = (progress / challenge.target) * 100;
              const isCompleted = progress >= challenge.target;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border ${
                    isCompleted
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted ? 'bg-yellow-500/20' : 'bg-zinc-800'
                    }`}>
                      <Icon className={`w-6 h-6 ${isCompleted ? 'text-yellow-500' : 'text-zinc-400'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-bold ${isCompleted ? 'text-yellow-400' : 'text-white'}`}>
                        {challenge.name}
                      </h3>
                      <p className="text-sm text-zinc-400">{challenge.desc}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-yellow-400">+{challenge.xp}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{progress}/{challenge.target}</span>
                      <span className="text-zinc-400">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Special Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Spezial Challenges
            </h2>
          </div>

          <div className="space-y-3">
            {SPECIAL_CHALLENGES.map((challenge, idx) => {
              const Icon = challenge.icon;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{challenge.name}</h3>
                      <p className="text-sm text-zinc-400">{challenge.desc}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-yellow-400">+{challenge.xp}</span>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}