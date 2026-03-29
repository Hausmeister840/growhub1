import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Activity, Heart, MessageCircle, UserPlus, Share2, 
  Eye, Loader2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const ACTIVITY_ICONS = {
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/20' },
  comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/20' },
  repost: { icon: Share2, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  story_view: { icon: Eye, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  join_live: { icon: Activity, color: 'text-pink-500', bg: 'bg-pink-500/20' }
};

export default function ActivityPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allActivities = await base44.entities.ActivityFeed.list('-created_date', 100).catch(() => []);
      
      // Filter activities for current user's network
      const following = user.following || [];
      const relevantActivities = (allActivities || []).filter(a => 
        following.includes(a.user_email) || a.user_email === user.email
      );
      setActivities(relevantActivities);
      
      // Only fetch users we need
      const emails = [...new Set(relevantActivities.map(a => a.user_email).filter(Boolean))];
      if (emails.length > 0) {
        const userResults = await Promise.all(
          emails.map(email => base44.entities.User.filter({ email }).catch(() => []))
        );
        const userMap = {};
        userResults.flat().forEach(u => {
          if (u?.email) {
            userMap[u.email] = {
              id: u.id,
              email: u.email,
              full_name: u.full_name,
              username: u.username,
              avatar_url: u.avatar_url
            };
          }
        });
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.action_type === filter);

  const getActivityText = (activity) => {
    const userName = users[activity.user_email]?.full_name || activity.user_email?.split('@')[0];
    
    switch (activity.action_type) {
      case 'like': return `${userName} hat einen Beitrag geliked`;
      case 'comment': return `${userName} hat kommentiert`;
      case 'follow': return `${userName} folgt jetzt jemandem`;
      case 'repost': return `${userName} hat geteilt`;
      case 'story_view': return `${userName} hat eine Story angesehen`;
      case 'join_live': return `${userName} ist einem Live beigetreten`;
      default: return `${userName} war aktiv`;
    }
  };

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
      <div className="sticky top-14 lg:top-0 z-20 bg-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-500" />
              Aktivitäten
            </h1>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'like', label: 'Likes' },
              { key: 'comment', label: 'Kommentare' },
              { key: 'follow', label: 'Follows' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.key
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Keine Aktivitäten</h3>
            <p className="text-zinc-400">
              Folge mehr Nutzern um ihre Aktivitäten zu sehen
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity, idx) => {
              const activityInfo = ACTIVITY_ICONS[activity.action_type] || ACTIVITY_ICONS.like;
              const Icon = activityInfo.icon;
              const activityUser = users[activity.user_email] || {};

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => navigate(createPageUrl(`Profile?id=${activityUser.id || activity.user_email}`))}
                    className="relative flex-shrink-0"
                  >
                    {activityUser.avatar_url ? (
                      <img src={activityUser.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                        {activityUser.full_name?.[0] || '?'}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${activityInfo.bg} flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 ${activityInfo.color}`} />
                    </div>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {activity.created_date && formatDistanceToNow(new Date(activity.created_date), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}