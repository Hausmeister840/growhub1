import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Challenge } from '@/entities/Challenge';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Target, Zap, CheckCircle2, Lock,
  Flame, Star, Gift, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const CHALLENGE_ICONS = {
  post: Trophy,
  comment: Target,
  social: Star,
  streak: Flame,
  growth: TrendingUp,
  knowledge: Gift
};

export default function DailyChallenge({ user }) {
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChallenges = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userChallenges = await Challenge.filter(
        { 
          target_user_email: user.email,
          status: 'active'
        },
        '-start_date',
        10
      );

      setChallenges(userChallenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const claimReward = async (challenge) => {
    try {
      // Challenge als completed markieren
      await Challenge.update(challenge.id, {
        status: 'completed',
        completion_date: new Date().toISOString()
      });

      // XP hinzufügen
      const newXP = (user.xp || 0) + challenge.xp_reward;
      await User.update(user.id, { xp: newXP });

      toast.success(`🎉 Challenge abgeschlossen! +${challenge.xp_reward} XP`, {
        description: challenge.title
      });

      loadChallenges();
    } catch (error) {
      console.error('Failed to claim reward:', error);
      toast.error('Fehler beim Einlösen der Belohnung');
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-zinc-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-20 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-zinc-800 text-center">
        <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Keine aktiven Challenges</p>
        <p className="text-sm text-zinc-500 mt-1">Komm morgen wieder!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {challenges.map((challenge, index) => {
          const IconComponent = CHALLENGE_ICONS[challenge.challenge_type] || Trophy;
          const progress = (challenge.current_progress / challenge.target_count) * 100;
          const isCompleted = challenge.current_progress >= challenge.target_count;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card rounded-2xl p-4 border transition-all ${
                isCompleted 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <IconComponent className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title & Description */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{challenge.title}</h4>
                    <span className="text-xl">{challenge.icon_emoji || '🎯'}</span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-3">{challenge.description}</p>

                  {/* Progress Bar */}
                  {!isCompleted && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>{challenge.current_progress} / {challenge.target_count}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Reward & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">+{challenge.xp_reward} XP</span>
                      </div>
                      
                      {challenge.coin_reward > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Gift className="w-4 h-4" />
                          <span className="font-bold">+{challenge.coin_reward} Coins</span>
                        </div>
                      )}
                    </div>

                    {isCompleted && (
                      <Button
                        onClick={() => claimReward(challenge)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Einlösen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}