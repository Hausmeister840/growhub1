
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Users, MessageCircle, CheckCircle, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';
import { useToast } from '@/components/ui/toast';
import { withRetry, globalRequestScheduler } from '../utils/performance';

const weeklyTemplates = [
  {
    id: "content_creator",
    title: "Content Creator",
    description: "Teile dein Wissen mit der Community",
    icon: MessageCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    tasks: [
      { id: "posts", label: "3 Posts erstellen", target: 3, xp: 75 },
      { id: "photos", label: "2 Fotos hochladen", target: 2, xp: 50 },
      { id: "tags", label: "5 Hashtags verwenden", target: 5, xp: 25 }
    ],
    bonus: 200,
    tier: "gold"
  },
  {
    id: "community_helper",
    title: "Community Helper",
    description: "Hilf anderen Growern mit Rat und Tat",
    icon: Users,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    tasks: [
      { id: "comments", label: "10 hilfreiche Kommentare", target: 10, xp: 100 },
      { id: "reactions", label: "20 Reaktionen vergeben", target: 20, xp: 40 },
      { id: "follows", label: "3 neuen Growern folgen", target: 3, xp: 60 }
    ],
    bonus: 150,
    tier: "silver"
  },
  {
    id: "engaged_member",
    title: "Aktives Mitglied",
    description: "Bleib aktiv und sammle Erfahrungen",
    icon: Zap,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    tasks: [
      { id: "daily_visits", label: "5 Tage aktiv sein", target: 5, xp: 50 },
      { id: "likes_given", label: "15 Likes vergeben", target: 15, xp: 30 },
      { id: "profile_visits", label: "8 Profile besuchen", target: 8, xp: 40 }
    ],
    bonus: 100,
    tier: "bronze"
  }
];

export default function WeeklyChallenge({ currentUser }) {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [weekStart, setWeekStart] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const { toast } = useToast();

  const initializeChallenge = useCallback(() => {
    if (!currentUser) return;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    setWeekStart(startOfWeek);

    // Challenge basierend auf User-Level auswählen
    const userXP = currentUser.xp || 0;
    let challengeTemplate;
    
    if (userXP < 200) {
      challengeTemplate = weeklyTemplates[2]; // engaged_member
    } else if (userXP < 500) {
      challengeTemplate = weeklyTemplates[1]; // community_helper
    } else {
      challengeTemplate = weeklyTemplates[0]; // content_creator
    }

    setCurrentChallenge(challengeTemplate);
  }, [currentUser]);

  const calculateProgress = useCallback(async () => {
    if (!currentUser || !weekStart) {
      setIsLoading(false); 
      return;
    }

    setNetworkError(false);
    setIsLoading(true);

    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // User-Aktivität für diese Woche laden using scheduler and retry
      let userPosts = [];
      let userComments = [];
      
      try {
        const postFetchFn = () => Post.filter({ 
          created_by: currentUser.email,
          created_date: { '$gte': weekStart.toISOString(), '$lt': weekEnd.toISOString() }
        });

        const commentFetchFn = () => Comment.filter({ 
          author_email: currentUser.email,
          created_date: { '$gte': weekStart.toISOString(), '$lt': weekEnd.toISOString() }
        });

        [userPosts, userComments] = await Promise.all([
            globalRequestScheduler.schedule(() => withRetry(postFetchFn)),
            globalRequestScheduler.schedule(() => withRetry(commentFetchFn))
        ]);
        
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setNetworkError(true);
        
        // Fallback: Verwende Mock-Daten oder cached Werte
        const fallbackProgress = {
          posts: Math.floor(Math.random() * 3),
          comments: Math.floor(Math.random() * 5),
          photos: Math.floor(Math.random() * 2),
          tags: Math.floor(Math.random() * 8),
          reactions: 0,
          follows: 0,
          daily_visits: Math.floor(Math.random() * 5),
          likes_given: Math.floor(Math.random() * 10),
          profile_visits: 0
        };
        
        setProgress(fallbackProgress);
        setIsLoading(false);
        return; // Exit early if API calls failed
      }

      // Progress für jede Task-Art berechnen
      const newProgress = {
        posts: userPosts.length,
        comments: userComments.length,
        photos: userPosts.filter(p => p.media_urls && p.media_urls.length > 0).length,
        tags: userPosts.reduce((sum, p) => sum + (p.tags?.length || 0), 0),
        reactions: 0, // Müsste separat getrackt werden
        follows: 0, // Müsste separat getrackt werden
        daily_visits: 0, // Müsste separat getrackt werden
        likes_given: 0, // Müsste separat getrackt werden
        profile_visits: 0 // Müsste separat getrackt werden
      };

      setProgress(newProgress);
    } catch (error) {
      console.error('General error in calculateProgress:', error);
      setNetworkError(true);
    } finally {
      setIsLoading(false); // Always set to false when finished
    }
  }, [currentUser, weekStart]);

  const updateTimeRemaining = useCallback(() => {
    if (!weekStart) return;

    const now = new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const timeLeft = weekEnd - now;
    
    if (timeLeft <= 0) {
      setTimeRemaining("Challenge beendet");
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h verbleibend`);
    } else {
      setTimeRemaining(`${hours}h verbleibend`);
    }
  }, [weekStart]);

  useEffect(() => {
    if (currentUser) {
      initializeChallenge();
    }
  }, [currentUser, initializeChallenge]);

  useEffect(() => {
    if (currentUser && weekStart) {
      calculateProgress();
    }
  }, [currentUser, weekStart, calculateProgress]);

  useEffect(() => {
    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [updateTimeRemaining]);

  const calculateTotalProgress = () => {
    if (!currentChallenge) return 0;
    
    const totalTasks = currentChallenge.tasks.length;
    const completedTasks = currentChallenge.tasks.filter(task => 
      (progress[task.id] || 0) >= task.target
    ).length;
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const calculateTotalXP = () => {
    if (!currentChallenge) return 0;
    
    let earnedXP = 0;
    currentChallenge.tasks.forEach(task => {
      const taskProgress = progress[task.id] || 0;
      const completed = taskProgress >= task.target;
      if (completed) {
        earnedXP += task.xp;
      }
    });
    
    const totalProgress = calculateTotalProgress();
    if (totalProgress === 100) {
      earnedXP += currentChallenge.bonus;
    }
    
    return earnedXP;
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "gold": return "text-yellow-400";
      case "silver": return "text-gray-300";
      case "bronze": return "text-orange-400";
      default: return "text-zinc-400";
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "gold": return "🥇";
      case "silver": return "🥈";
      case "bronze": return "🥉";
      default: return "🏆";
    }
  };

  const handleRetry = () => {
    setNetworkError(false);
    calculateProgress();
  };

  if (isLoading || !currentChallenge) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800/30 animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 w-3/4 bg-zinc-700 rounded mb-4"></div>
          <div className="h-8 w-full bg-zinc-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-zinc-700 rounded"></div>
            <div className="h-3 w-full bg-zinc-700 rounded"></div>
            <div className="h-3 w-2/3 bg-zinc-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (networkError) {
    return (
      <Card className="bg-zinc-900/50 border-red-500/30">
        <CardContent className="p-6 text-center">
          <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Verbindungsfehler</h3>
          <p className="text-zinc-400 text-sm mb-4">Challenge-Daten konnten nicht geladen werden</p>
          <Button onClick={handleRetry} variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  const Icon = currentChallenge.icon;
  const totalProgress = calculateTotalProgress();
  const earnedXP = calculateTotalXP();
  const isCompleted = totalProgress === 100;

  return (
    <Card className={`${currentChallenge.bgColor} border-zinc-800/50 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 pointer-events-none"></div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${getTierColor(currentChallenge.tier)} bg-current/10`}>
            {getTierIcon(currentChallenge.tier)} {currentChallenge.tier.toUpperCase()}
          </Badge>
          <div className="text-xs text-zinc-400">{timeRemaining}</div>
        </div>
        
        <CardTitle className="flex items-center gap-3 text-zinc-100">
          <div className={`w-10 h-10 ${currentChallenge.bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${currentChallenge.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{currentChallenge.title}</h3>
            <p className="text-sm text-zinc-400 font-normal">{currentChallenge.description}</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-zinc-300">Fortschritt</span>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <span className={`font-bold ${isCompleted ? 'text-green-400' : 'text-zinc-100'}`}>
                {totalProgress}%
              </span>
            </div>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {currentChallenge.tasks.map(task => {
            const taskProgress = progress[task.id] || 0;
            const isTaskCompleted = taskProgress >= task.target;
            const taskProgressPercent = Math.min((taskProgress / task.target) * 100, 100);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border transition-all ${
                  isTaskCompleted 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-zinc-800/30 border-zinc-700/30'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isTaskCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                    <span className={`text-sm font-medium ${
                      isTaskCompleted ? 'text-green-400' : 'text-zinc-300'
                    }`}>
                      {task.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                      +{task.xp} XP
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {taskProgress}/{task.target}
                    </span>
                  </div>
                </div>
                <Progress value={taskProgressPercent} className="h-1.5" />
              </motion.div>
            );
          })}
        </div>

        {/* Rewards */}
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-zinc-100 mb-1">Belohnung</h4>
              <p className="text-xs text-zinc-400">
                {isCompleted ? 'Erhalten!' : 'Bei Abschluss aller Aufgaben'}
              </p>
            </div>
            <div className="text-right">
              <div className={`font-bold text-lg ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
                +{earnedXP} XP
              </div>
              {!isCompleted && (
                <div className="text-xs text-zinc-500">
                  +{currentChallenge.bonus} Bonus
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Celebration */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 border border-green-500/30 rounded-lg p-4 text-center"
            >
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-bold text-green-400 mb-1">Challenge erfolgreich!</h4>
              <p className="text-xs text-zinc-300">Du hast {earnedXP} XP erhalten!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
