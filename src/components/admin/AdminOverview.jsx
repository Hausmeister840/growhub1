import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Post } from "@/entities/Post";
import { Comment } from "@/entities/Comment";
import { 
  Users, FileText, Activity, AlertTriangle, TrendingUp, 
  TrendingDown, ArrowRight, Zap, MessageCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow, subDays } from "date-fns";
import { de } from "date-fns/locale";

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState({
    users: { total: 0, new7days: 0, trend: 0 },
    posts: { total: 0, new7days: 0, trend: 0 },
    comments: { total: 0, new7days: 0, trend: 0 },
    reports: { total: 0, pending: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [users, posts, comments] = await Promise.all([
        User.list(),
        Post.list(),
        Comment.list()
      ]);

      const now = new Date();
      const date7DaysAgo = subDays(now, 7);
      const date14DaysAgo = subDays(now, 14);

      // Users
      const newUsers7 = users.filter(u => new Date(u.created_date) >= date7DaysAgo).length;
      const newUsers14 = users.filter(u => new Date(u.created_date) >= date14DaysAgo && new Date(u.created_date) < date7DaysAgo).length;
      const usersTrend = newUsers14 > 0 ? ((newUsers7 - newUsers14) / newUsers14 * 100) : 0;

      // Posts
      const newPosts7 = posts.filter(p => new Date(p.created_date) >= date7DaysAgo).length;
      const newPosts14 = posts.filter(p => new Date(p.created_date) >= date14DaysAgo && new Date(p.created_date) < date7DaysAgo).length;
      const postsTrend = newPosts14 > 0 ? ((newPosts7 - newPosts14) / newPosts14 * 100) : 0;

      // Comments
      const newComments7 = comments.filter(c => new Date(c.created_date) >= date7DaysAgo).length;
      const newComments14 = comments.filter(c => new Date(c.created_date) >= date14DaysAgo && new Date(c.created_date) < date7DaysAgo).length;
      const commentsTrend = newComments14 > 0 ? ((newComments7 - newComments14) / newComments14 * 100) : 0;

      // Reports
      const pendingReports = posts.filter(p => p.requires_manual_review || p.moderation_status === 'pending').length;

      setStats({
        users: { total: users.length, new7days: newUsers7, trend: usersTrend },
        posts: { total: posts.length, new7days: newPosts7, trend: postsTrend },
        comments: { total: comments.length, new7days: newComments7, trend: commentsTrend },
        reports: { total: pendingReports, pending: pendingReports }
      });

      // Recent Activity
      const allActivity = [
        ...posts.slice(0, 5).map(p => ({ type: 'post', data: p, time: p.created_date })),
        ...comments.slice(0, 5).map(c => ({ type: 'comment', data: c, time: c.created_date })),
        ...users.slice(0, 5).map(u => ({ type: 'user', data: u, time: u.created_date }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

      setRecentActivity(allActivity);

      // AI Insights
      const generatedInsights = [];
      
      if (usersTrend > 20) {
        generatedInsights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Starkes Nutzerwachstum',
          message: `${usersTrend.toFixed(0)}% mehr Nutzer als letzte Woche`
        });
      } else if (usersTrend < -20) {
        generatedInsights.push({
          type: 'warning',
          icon: TrendingDown,
          title: 'Nutzerwachstum verlangsamt',
          message: `${Math.abs(usersTrend).toFixed(0)}% weniger Nutzer als letzte Woche`
        });
      }

      if (pendingReports > 10) {
        generatedInsights.push({
          type: 'alert',
          icon: AlertTriangle,
          title: 'Viele gemeldete Inhalte',
          message: `${pendingReports} Posts warten auf Moderation`,
          action: () => onNavigate('content')
        });
      }

      if (postsTrend > 30) {
        generatedInsights.push({
          type: 'success',
          icon: Zap,
          title: 'Hohe Content-Aktivität',
          message: 'Community erstellt mehr Inhalte als üblich'
        });
      }

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            const colors = {
              success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
              warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
              alert: 'from-red-500/20 to-pink-500/20 border-red-500/30'
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br ${colors[insight.type]} border rounded-3xl p-6 ${insight.action ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
                onClick={insight.action}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{insight.title}</h3>
                    <p className="text-zinc-300 text-sm">{insight.message}</p>
                  </div>
                  {insight.action && (
                    <ArrowRight className="w-5 h-5 text-white/50" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-3xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => onNavigate('users')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.users.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.users.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.users.trend).toFixed(0)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.users.total.toLocaleString()}</p>
          <p className="text-zinc-400 text-sm">Gesamt Nutzer</p>
          <p className="text-blue-400 text-xs mt-2">+{stats.users.new7days} diese Woche</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-3xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => onNavigate('content')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.posts.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.posts.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.posts.trend).toFixed(0)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.posts.total.toLocaleString()}</p>
          <p className="text-zinc-400 text-sm">Gesamt Posts</p>
          <p className="text-green-400 text-xs mt-2">+{stats.posts.new7days} diese Woche</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-3xl p-6 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.comments.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.comments.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.comments.trend).toFixed(0)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.comments.total.toLocaleString()}</p>
          <p className="text-zinc-400 text-sm">Gesamt Kommentare</p>
          <p className="text-purple-400 text-xs mt-2">+{stats.comments.new7days} diese Woche</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-3xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => onNavigate('content')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.reports.pending.toLocaleString()}</p>
          <p className="text-zinc-400 text-sm">Gemeldete Inhalte</p>
          <p className="text-red-400 text-xs mt-2">Warten auf Moderation</p>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Letzte Aktivität</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-2xl hover:bg-zinc-800 transition-all"
            >
              {activity.type === 'user' && (
                <>
                  <Users className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Neuer Nutzer: {activity.data.full_name}</p>
                    <p className="text-zinc-500 text-xs">{formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: de })}</p>
                  </div>
                </>
              )}
              {activity.type === 'post' && (
                <>
                  <FileText className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Neuer Post</p>
                    <p className="text-zinc-400 text-xs truncate">{activity.data.content}</p>
                    <p className="text-zinc-500 text-xs mt-1">{formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: de })}</p>
                  </div>
                </>
              )}
              {activity.type === 'comment' && (
                <>
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Neuer Kommentar</p>
                    <p className="text-zinc-400 text-xs truncate">{activity.data.content}</p>
                    <p className="text-zinc-500 text-xs mt-1">{formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: de })}</p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}