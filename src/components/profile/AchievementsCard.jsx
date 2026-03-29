import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Zap, Award, Star } from 'lucide-react';
import { achievementsList } from '@/components/utils/gamification';

const calculateLevel = (xp) => {
    const level = Math.floor(Math.pow(xp / 100, 0.7)) + 1;
    const nextLevelXp = Math.floor(Math.pow(level, 1/0.7) * 100);
    const currentLevelXp = Math.floor(Math.pow(level - 1, 1/0.7) * 100);
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return { level, progress: Math.max(0, Math.min(100, progress)), xp, nextLevelXp };
};

const getIcon = (iconName) => {
    // A mapping from string name to Lucide component
    const icons = {
        'Award': Award,
        'Star': Star,
        'Trophy': Trophy,
        'Zap': Zap,
        // Add more icons from achievementsList here
        'MessageSquare': Award,
        'MessagesSquare': Award,
        'Heart': Award,
        'ThumbsUp': Award,
        'UserPlus': Award,
        'Users': Award,
        'MessageCircle': Award,
        'MessageSquareText': Award,
        'MessagesSquareText': Award,
        'Camera': Award,
    };
    return icons[iconName] || Star;
};


export default function AchievementsCard({ user }) {
  if (!user) return null;

  const levelInfo = calculateLevel(user.xp || 0);
  const userAchievements = (user.badges || [])
    .map(badgeId => achievementsList.find(ach => ach.id === badgeId))
    .filter(Boolean); // Filter out any not found achievements

  return (
    <Card className="glass-effect border-gold-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Gamification & Erfolge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & XP */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-green-400 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Level {levelInfo.level}
            </span>
            <span className="text-zinc-400">{levelInfo.xp} / {levelInfo.nextLevelXp} XP</span>
          </div>
          <Progress value={levelInfo.progress} className="w-full h-2 [&>*]:bg-green-500" />
        </div>

        {/* Achievements */}
        <div>
          <h4 className="text-zinc-300 text-sm font-semibold mb-2">Erreichte Erfolge</h4>
          {userAchievements.length > 0 ? (
            <div className="space-y-2">
              {userAchievements.slice(0, 5).map(ach => {
                 const IconComponent = getIcon(ach.icon);
                 return (
                    <div key={ach.id} className="flex items-center gap-3 bg-zinc-800/50 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-500/20 flex items-center justify-center rounded-md">
                            <IconComponent className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white text-sm">{ach.name}</p>
                            <p className="text-xs text-zinc-400">{ach.description}</p>
                        </div>
                    </div>
                );
              })}
              {userAchievements.length > 5 && (
                 <p className="text-xs text-center text-zinc-400 mt-2">
                   + {userAchievements.length - 5} weitere...
                 </p>
              )}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm text-center py-4 bg-zinc-800/40 rounded-lg">Noch keine Erfolge freigeschaltet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}