import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  TrendingUp, Users, MessageSquare, Loader2
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role === 'admin') {
        const [posts, users] = await Promise.all([
          base44.entities.Post.list('-created_date', 10),
          base44.entities.User.filter({})
        ]);

        setStats({
          totalUsers: users.length,
          totalPosts: posts.length,
          activeToday: users.filter(u => {
            if (!u.last_online_at) return false;
            const lastOnline = new Date(u.last_online_at);
            const today = new Date();
            return lastOnline.toDateString() === today.toDateString();
          }).length
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setUser(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Willkommen zurück, {user.full_name}!</p>
        </div>

        {/* Admin Stats */}
        {user.role === 'admin' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Nutzer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-sm text-zinc-400 mt-1">{stats.activeToday} heute aktiv</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalPosts}</p>
                <p className="text-sm text-zinc-400 mt-1">Gesamt erstellt</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Aktivität
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {stats.activeToday > 0 ? '+' : ''}{stats.activeToday}
                </p>
                <p className="text-sm text-zinc-400 mt-1">Heute</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Links */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/Feed">
                <Button variant="outline" className="w-full">Feed</Button>
              </Link>
              <Link to="/Map">
                <Button variant="outline" className="w-full">Karte</Button>
              </Link>
              <Link to="/Marketplace">
                <Button variant="outline" className="w-full">Marketplace</Button>
              </Link>
              <Link to="/Messages">
                <Button variant="outline" className="w-full">Nachrichten</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}