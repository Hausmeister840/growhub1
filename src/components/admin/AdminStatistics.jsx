import { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { BarChart3, Users, Activity } from "lucide-react";
import { subDays, startOfDay } from "date-fns";
import { toast } from 'sonner';

export default function AdminStatistics() {
  const [stats, setStats] = useState({
    users: { total: 0, new7days: 0, new30days: 0 },
    posts: { total: 0, new7days: 0, new30days: 0 },
    comments: { total: 0, new7days: 0, new30days: 0 },
    engagement: { avgPostsPerUser: 0, avgCommentsPerPost: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyActivity, setDailyActivity] = useState([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [users, posts, comments] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Post.list('-created_date', 2000),
        base44.entities.Comment.list('-created_date', 2000)
      ]);

      const now = new Date();
      const date7DaysAgo = subDays(now, 7);
      const date30DaysAgo = subDays(now, 30);

      // User stats
      const newUsers7 = users.filter(u => new Date(u.created_date) >= date7DaysAgo).length;
      const newUsers30 = users.filter(u => new Date(u.created_date) >= date30DaysAgo).length;

      // Post stats
      const newPosts7 = posts.filter(p => new Date(p.created_date) >= date7DaysAgo).length;
      const newPosts30 = posts.filter(p => new Date(p.created_date) >= date30DaysAgo).length;

      // Comment stats
      const newComments7 = comments.filter(c => new Date(c.created_date) >= date7DaysAgo).length;
      const newComments30 = comments.filter(c => new Date(c.created_date) >= date30DaysAgo).length;

      // Engagement
      const avgPostsPerUser = users.length > 0 ? (posts.length / users.length).toFixed(2) : 0;
      const avgCommentsPerPost = posts.length > 0 ? (comments.length / posts.length).toFixed(2) : 0;

      // Daily activity (last 7 days)
      const daily = [];
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(now, i));
        const nextDate = startOfDay(subDays(now, i - 1));
        
        const dayPosts = posts.filter(p => {
          const created = new Date(p.created_date);
          return created >= date && created < nextDate;
        }).length;

        const dayComments = comments.filter(c => {
          const created = new Date(c.created_date);
          return created >= date && created < nextDate;
        }).length;

        daily.push({
          date: date.toLocaleDateString('de-DE', { weekday: 'short' }),
          posts: dayPosts,
          comments: dayComments
        });
      }

      setStats({
        users: { total: users.length, new7days: newUsers7, new30days: newUsers30 },
        posts: { total: posts.length, new7days: newPosts7, new30days: newPosts30 },
        comments: { total: comments.length, new7days: newComments7, new30days: newComments30 },
        engagement: { avgPostsPerUser, avgCommentsPerPost }
      });

      setDailyActivity(daily);
    } catch (error) {
      console.error("Stats error:", error);
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <h3 className="font-bold text-white">Nutzerwachstum</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-white">{stats.users.total}</p>
              <p className="text-sm text-zinc-400">Gesamt Nutzer</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-green-400 font-semibold">+{stats.users.new7days}</p>
                <p className="text-zinc-500">Letzte 7 Tage</p>
              </div>
              <div>
                <p className="text-green-400 font-semibold">+{stats.users.new30days}</p>
                <p className="text-zinc-500">Letzte 30 Tage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-green-500" />
            <h3 className="font-bold text-white">Post-Aktivität</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-white">{stats.posts.total}</p>
              <p className="text-sm text-zinc-400">Gesamt Posts</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-green-400 font-semibold">+{stats.posts.new7days}</p>
                <p className="text-zinc-500">Letzte 7 Tage</p>
              </div>
              <div>
                <p className="text-green-400 font-semibold">+{stats.posts.new30days}</p>
                <p className="text-zinc-500">Letzte 30 Tage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-purple-500" />
            <h3 className="font-bold text-white">Kommentare</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-white">{stats.comments.total}</p>
              <p className="text-sm text-zinc-400">Gesamt Kommentare</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-green-400 font-semibold">+{stats.comments.new7days}</p>
                <p className="text-zinc-500">Letzte 7 Tage</p>
              </div>
              <div>
                <p className="text-green-400 font-semibold">+{stats.comments.new30days}</p>
                <p className="text-zinc-500">Letzte 30 Tage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Engagement-Metriken</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Ø Posts pro Nutzer</span>
              <span className="text-white font-bold">{stats.engagement.avgPostsPerUser}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Ø Kommentare pro Post</span>
              <span className="text-white font-bold">{stats.engagement.avgCommentsPerPost}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Aktivität (7 Tage)</h3>
          <div className="space-y-2">
            {dailyActivity.map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-zinc-400 w-12 text-sm">{day.date}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-6 flex items-center overflow-hidden">
                  <div
                    className="bg-green-500 h-full flex items-center justify-end px-2 text-xs text-white font-medium"
                    style={{ width: `${Math.max((day.posts / Math.max(...dailyActivity.map(d => d.posts))) * 100, 5)}%` }}
                  >
                    {day.posts > 0 && day.posts}
                  </div>
                </div>
                <span className="text-zinc-500 text-xs w-16">Posts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}