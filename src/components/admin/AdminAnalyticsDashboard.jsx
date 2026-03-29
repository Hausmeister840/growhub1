import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, FileText, TrendingUp, 
  AlertTriangle, Activity, RefreshCw,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * 📊 ADMIN ANALYTICS DASHBOARD
 */

const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('admin/getAnalyticsDashboard', { period });
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        toast.error('Fehler beim Laden der Analytics');
      }
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Lade Analytics...</p>
        </div>
      </div>
    );
  }

  const { overview, top_content, top_creators, moderation } = analytics;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-zinc-400">GrowHub Community-Statistiken</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex gap-2 bg-zinc-900 rounded-lg p-1">
              {['24h', '7d', '30d', 'all'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    period === p 
                      ? 'bg-green-500 text-black' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {p === 'all' ? 'Gesamt' : p.toUpperCase()}
                </button>
              ))}
            </div>
            
            <Button
              onClick={loadAnalytics}
              variant="outline"
              size="icon"
              className="border-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Gesamt-User"
            value={overview.total_users.toLocaleString()}
            change={overview.user_growth_pct}
            icon={Users}
            color="blue"
          />
          
          <StatCard
            title="Gesamt-Posts"
            value={overview.total_posts.toLocaleString()}
            change={overview.post_growth_pct}
            icon={FileText}
            color="green"
          />
          
          <StatCard
            title="Engagement Rate"
            value={`${overview.engagement_rate_pct}%`}
            icon={Activity}
            color="purple"
          />
          
          <StatCard
            title="Offene Reports"
            value={moderation.open_reports}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Top Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {top_content.posts.slice(0, 5).map((post, idx) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <span className="text-2xl font-bold text-zinc-600">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span>👁️ {post.views}</span>
                        <span>❤️ {post.reactions}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Top Creators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {top_creators.slice(0, 5).map((creator, idx) => (
                  <div key={creator.email} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <span className="text-2xl font-bold text-zinc-600">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{creator.email}</p>
                      <p className="text-xs text-zinc-400">{creator.post_count} Posts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}