import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, Plus, MessageCircle, Settings, Share2
} from 'lucide-react';
import { toast } from 'sonner';

import ThreadCard from '../components/community/ThreadCard';
import CreateThreadModal from '../components/community/CreateThreadModal';

export default function SpaceDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const spaceId = new URLSearchParams(location.search).get('id');
  
  const [user, setUser] = useState(null);
  const [space, setSpace] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateThread, setShowCreateThread] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };
    init();
    if (spaceId) {
      loadSpace();
      loadThreads();
    }
  }, [spaceId]);

  const loadSpace = async () => {
    try {
      const spaces = await base44.entities.CommunitySpace.filter({ id: spaceId });
      if (spaces && spaces.length > 0) {
        setSpace(spaces[0]);
      }
    } catch (err) {
      console.error('Load space error:', err);
      toast.error('Space nicht gefunden');
      navigate(-1);
    }
  };

  const loadThreads = async () => {
    setLoading(true);
    try {
      const allThreads = await base44.entities.CommunityThread.filter({ space_id: spaceId }, '-created_date', 50);
      setThreads(allThreads || []);
    } catch (err) {
      console.error('Load threads error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSpace = async () => {
    if (!user) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }

    try {
      const isMember = space.members?.includes(user.email);
      const updatedMembers = isMember
        ? space.members.filter(m => m !== user.email)
        : [...(space.members || []), user.email];

      await base44.entities.CommunitySpace.update(spaceId, {
        members: updatedMembers,
        member_count: updatedMembers.length
      });

      setSpace({ ...space, members: updatedMembers, member_count: updatedMembers.length });
      toast.success(isMember ? 'Space verlassen' : 'Space beigetreten!');
    } catch (err) {
      console.error('Join error:', err);
      toast.error('Fehler');
    }
  };

  if (!space) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = space.members?.includes(user?.email);
  const isOwner = space.owner_email === user?.email;

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-green-500 to-emerald-600">
        {space.cover_image && (
          <img src={space.cover_image} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 -mt-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white mb-1">{space.name}</h1>
              {space.description && (
                <p className="text-zinc-400 text-sm">{space.description}</p>
              )}
            </div>
            {isOwner && (
              <button className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{space.member_count || 0} Mitglieder</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{space.post_count || 0} Posts</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleJoinSpace}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isMember
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-green-500 text-black hover:bg-green-600'
              }`}
            >
              {isMember ? 'Beigetreten' : 'Beitreten'}
            </button>
            <button className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl">
              <Share2 className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Threads */}
      <div className="px-4 py-6 space-y-3">
        {threads.length === 0 && !loading ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm mb-4">Noch keine Threads</p>
            {isMember && (
              <button
                onClick={() => setShowCreateThread(true)}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-full"
              >
                Ersten Thread erstellen
              </button>
            )}
          </div>
        ) : (
          threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))
        )}
      </div>

      {/* FAB */}
      {isMember && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateThread(true)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30 z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      <CreateThreadModal
        isOpen={showCreateThread}
        onClose={() => setShowCreateThread(false)}
        spaceId={spaceId}
        currentUser={user}
        onCreated={() => {
          setShowCreateThread(false);
          loadThreads();
        }}
      />
    </div>
  );
}