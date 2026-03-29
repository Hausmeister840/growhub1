import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Radio, Eye, Play, Loader2, 
  Video, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'all', label: 'Alle', icon: '📺' },
  { key: 'growing', label: 'Anbau', icon: '🌱' },
  { key: 'harvest', label: 'Ernte', icon: '🌿' },
  { key: 'tutorial', label: 'Tutorial', icon: '📚' },
  { key: 'q&a', label: 'Q&A', icon: '❓' },
  { key: 'chill', label: 'Chill', icon: '😌' }
];

export default function LiveStreams() {
  const [currentUser, setCurrentUser] = useState(null);
  const [streams, setStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [users, setUsers] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, allStreams] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.LiveStream.list('-created_date', 50).catch(() => [])
      ]);

      setCurrentUser(user);
      setStreams(allStreams || []);
      
      // Load users for stream creators
      if (allStreams && allStreams.length > 0) {
        const creatorEmails = [...new Set(allStreams.map(s => s.created_by).filter(Boolean))];
        if (creatorEmails.length > 0) {
          const loadedUsers = await base44.entities.User.list('-created_date', 200);
          const userMap = {};
          (loadedUsers || []).forEach(u => {
            if (u?.email) userMap[u.email] = u;
            if (u?.id) userMap[u.id] = u;
          });
          setUsers(userMap);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Fehler beim Laden der Streams');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream => {
    if (selectedCategory === 'all') return true;
    return stream.category === selectedCategory;
  });

  const liveStreams = filteredStreams.filter(s => s.status === 'live');
  const scheduledStreams = filteredStreams.filter(s => s.status === 'scheduled');

  const handleGoLive = () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }
    toast.info('Live-Streaming kommt bald!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          <p className="text-zinc-500 text-sm">Lade Streams...</p>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <Radio className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Keine Live-Streams</h2>
          <p className="text-zinc-400 mb-6">
            Aktuell ist niemand live. Werde der Erste und starte deinen eigenen Stream!
          </p>
          <Button 
            onClick={handleGoLive}
            className="bg-red-500 hover:bg-red-600 gap-2"
          >
            <Video className="w-4 h-4" />
            Stream starten (Bald verfügbar)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-gradient-to-b from-red-500/20 to-black border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center animate-pulse">
                <Radio className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Live Streams</h1>
                <p className="text-sm text-zinc-400">
                  {liveStreams.length} Live • {scheduledStreams.length} Geplant
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleGoLive}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              <Video className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Live Now */}
        {liveStreams.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              Jetzt Live
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream, idx) => {
                const streamer = users[stream.created_by] || {};
                
                return (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-zinc-800">
                      {stream.thumbnail_url ? (
                        <img 
                          src={stream.thumbnail_url} 
                          alt={stream.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-pink-500/20">
                          <Radio className="w-12 h-12 text-red-400" />
                        </div>
                      )}
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 rounded-lg flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-white">LIVE</span>
                      </div>
                      
                      {/* Viewers */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1">
                        <Eye className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">{stream.viewer_count || 0}</span>
                      </div>
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-white mb-2 line-clamp-1">{stream.title}</h3>
                      <div className="flex items-center gap-2">
                        {streamer.avatar_url ? (
                          <img src={streamer.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                            {streamer.full_name?.[0] || '?'}
                          </div>
                        )}
                        <span className="text-sm text-zinc-400">
                          {streamer.username || streamer.full_name || 'Streamer'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scheduled */}
        {scheduledStreams.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Geplante Streams
            </h2>
            
            <div className="space-y-3">
              {scheduledStreams.map((stream, idx) => {
                const streamer = users[stream.created_by] || {};
                
                return (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-4"
                  >
                    {stream.thumbnail_url ? (
                      <img src={stream.thumbnail_url} className="w-20 h-14 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Radio className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{stream.title}</h3>
                      <p className="text-sm text-zinc-400">
                        {streamer.username || streamer.full_name || 'Streamer'}
                      </p>
                    </div>
                    
                    <Button variant="outline" size="sm" className="border-zinc-700">
                      Erinnerung
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {liveStreams.length === 0 && scheduledStreams.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Keine Streams</h3>
            <p className="text-zinc-400 mb-6">
              Aktuell gibt es keine Live-Streams. Sei der Erste!
            </p>
            <Button 
              onClick={handleGoLive}
              className="bg-red-500 hover:bg-red-600"
            >
              <Video className="w-4 h-4 mr-2" />
              Stream starten
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}