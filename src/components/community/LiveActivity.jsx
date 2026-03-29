
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, 
  Heart, 
  MessageCircle, 
  UserPlus,
  TrendingUp,
  Clock,
  WifiOff,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Post } from '@/entities/Post';
import { User } from '@/entities/User';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { globalRequestScheduler, withRetry } from '@/components/utils/performance'; // ✅ NEU: Scheduler importiert

// Check if user is online
const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine !== false;
};

export default function LiveActivity({ currentUser = null }) {
  const [activities, setActivities] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    postsToday: 0,
    trendsCore: 85
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [authRequired, setAuthRequired] = useState(false);

  const fetchLiveActivity = useCallback(async () => {
    // Für nicht-angemeldete User: vereinfachte Mock-Daten
    if (currentUser === undefined) {
      return;
    }
    
    if (currentUser === null) {
      // Zeige vereinfachte öffentliche Stats für nicht-angemeldete User
      setCommunityStats({
        totalUsers: 25,
        activeToday: 8,
        postsToday: 6,
        trendsCore: 82
      });
      setActivities([]);
      setOnlineUsers([]);
      setIsLoading(false);
      return;
    }

    if (!isOnline()) {
      setIsOffline(true);
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setAuthRequired(false); // Reset auth required state on new fetch attempt
    
    try {
      // Vereinfachte Aktivitäten: nur öffentliche Posts der letzten 2 Stunden
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      let recentPosts = [];
      try {
        const posts = await globalRequestScheduler.schedule(() => // ✅ NEU: Call wird terminiert
            withRetry(() => Post.filter({
                visibility: 'public',
                created_date: { '$gte': twoHoursAgo.toISOString() }
            }))
        );
        recentPosts = Array.isArray(posts) ? posts : [];
      } catch (postError) {
        console.warn('Could not load recent posts:', postError);
        recentPosts = [];
      }

      // Vereinfachte Aktivitätsliste (only posts, comments removed as per outline)
      const combinedActivities = recentPosts
        .filter(p => p && p.id && p.created_by && typeof p.content === 'string' && p.content.trim() !== '') // FIXED: Stricter filtering for valid, string-based content
        .map(post => ({
          type: 'post',
          user_email: post.created_by,
          content: post.content, // Already verified it's a string
          timestamp: post.created_date,
          id: post.id,
          data: post
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8); // Begrenzt auf 8 für Performance

      setActivities(combinedActivities);

      // Vereinfachte User-Daten laden
      const userEmails = [...new Set(combinedActivities.map(a => a.user_email))];
      if (userEmails.length > 0) {
        try {
          // Fetch users based on emails from public activities
          const users = await globalRequestScheduler.schedule(() => // ✅ NEU: Call wird terminiert
            withRetry(() => User.filter({ email: { '$in': userEmails } }))
          );
          setOnlineUsers(Array.isArray(users) ? users : []);
        } catch (userError) {
          console.warn('Could not load users for activities:', userError);
          // Fallback: Mock-User-Objekte
          const fallbackUsers = userEmails.map(email => ({
            email,
            full_name: email.split('@')[0] || 'User',
            avatar_url: null
          }));
          setOnlineUsers(fallbackUsers);
        }
      }

      // Vereinfachte Community-Stats
      try {
        let postsToday = 0;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayPosts = await globalRequestScheduler.schedule(() => // ✅ NEU: Call wird terminiert
            withRetry(() => Post.filter({
                visibility: 'public',
                created_date: { '$gte': todayStart.toISOString() }
            }))
        );
        postsToday = Array.isArray(todayPosts) ? todayPosts.length : 0;

        setCommunityStats({
          totalUsers: Math.max(userEmails.length * 4, 15), // Schätzung
          activeToday: Math.max(userEmails.length, 3),
          postsToday: Math.max(postsToday, recentPosts.length),
          trendsCore: Math.round(Math.random() * 15 + 80) // 80-95
        });
      } catch (statsError) {
        console.warn('Could not load community stats:', statsError);
        // Fallback-Stats
        setCommunityStats({
          totalUsers: userEmails.length * 5 || 20,
          activeToday: Math.max(userEmails.length, 5),
          postsToday: Math.max(recentPosts.length, 3),
          trendsCore: 85
        });
      }

      setAuthRequired(false); // Successfully fetched, so auth is not required
    } catch (error) {
      console.error('Failed to fetch live activity:', error);
      if (error.message?.includes('403') || error.message?.includes('You must be logged in')) {
        setAuthRequired(true);
      } else {
        setHasError(true);
      }
      
      // Fallback: Basis-Community-Stats auch bei Fehlern
      setCommunityStats({
        totalUsers: 18,
        activeToday: 6,
        postsToday: 4,
        trendsCore: 82
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network back online');
      setIsOffline(false);
      setHasError(false);
      if (currentUser !== undefined && currentUser !== null) {
        fetchLiveActivity();
      }
    };
    
    const handleOffline = () => {
      console.log('Network went offline');
      setIsOffline(true);
      setHasError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, fetchLiveActivity]);

  useEffect(() => {
    if (currentUser !== undefined && !isOffline) {
      fetchLiveActivity();
      const interval = setInterval(fetchLiveActivity, 60000); // Reduced frequency to 60 seconds
      return () => clearInterval(interval);
    }
  }, [fetchLiveActivity, isOffline, currentUser]); // FIX: added currentUser

  const getActivityIcon = (type) => {
    switch (type) {
      case 'post': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-400" />;
      case 'like': return <Heart className="w-4 h-4 text-red-400" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUserData = (email) => {
    return onlineUsers.find(user => user.email === email);
  };

  const getUserInitials = (email) => {
    const user = getUserData(email);
    if (user?.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return email[0]?.toUpperCase() || '?';
  };

  // Auth required state (triggered by 403 error for authenticated users trying to fetch data)
  if (authRequired) {
    return (
      <Card className="glass-effect border-yellow-500/30">
        <CardContent className="p-6 text-center">
          <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Anmeldung erforderlich</h3>
          <p className="text-zinc-400 text-sm">Live-Aktivitäten sind nur für angemeldete Nutzer sichtbar</p>
        </CardContent>
      </Card>
    );
  }

  // Error/Offline state
  if (hasError || isOffline) {
    return (
      <Card className="glass-effect border-red-500/30">
        <CardContent className="p-6 text-center">
          {isOffline ? (
            <>
              <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Offline</h3>
              <p className="text-zinc-400 text-sm mb-4">Keine Internetverbindung</p>
            </>
          ) : (
            <>
              <Activity className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Verbindungsfehler</h3>
              <p className="text-zinc-400 text-sm mb-4">Aktivitäten konnten nicht geladen werden</p>
              <Button 
                onClick={fetchLiveActivity} 
                variant="outline" 
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card className="glass-effect border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Community Pulse
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-green-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {communityStats.activeToday}
              </div>
              <p className="text-xs text-zinc-400">Aktiv heute</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {communityStats.postsToday}
              </div>
              <p className="text-xs text-zinc-400">Posts heute</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300">Community ist aktiv</span>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Live-Aktivitäten
            <Badge className="bg-green-500/20 text-green-400 text-xs ml-auto">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <AnimatePresence>
              {activities.slice(0, 10).map((activity, index) => {
                // FIXED: content is now guaranteed to be a string, no more null-checks needed here.
                const contentSafe = activity.content;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={getUserData(activity.user_email)?.avatar_url} />
                      <AvatarFallback className="bg-green-600 text-white text-xs">
                        {getUserInitials(activity.user_email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActivityIcon(activity.type)}
                        <span className="text-sm font-medium text-white">
                          {getUserData(activity.user_email)?.full_name || activity.user_email.split('@')[0]}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {activity.type === 'post' ? 'hat gepostet' : 'hat kommentiert'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 truncate">
                        {contentSafe.slice(0, 80)}
                        {contentSafe.length > 80 && '...'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {activities.length === 0 && !isLoading && (
            <div className="text-center py-8 text-zinc-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Noch keine aktuelle Aktivität</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Users Indicator */}
      <Card className="glass-effect">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300">
                {/* Ensure onlineUsers.length doesn't exceed 5 for display, but show actual if less */}
                {Math.min(onlineUsers.length, 5)} Nutzer gerade aktiv
              </span>
            </div>
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 3).map((user, index) => (
                <Avatar key={user.id || index} className="w-6 h-6 border-2 border-zinc-800">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-green-600 text-white text-xs">
                    {getUserInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {onlineUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-800 flex items-center justify-center">
                  <span className="text-xs text-zinc-300">+{onlineUsers.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
