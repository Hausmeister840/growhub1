import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2, Image as ImageIcon, Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ReelItem from '../components/reels/ReelItem';
import ReelOverlay from '../components/reels/ReelOverlay';
import ReelsCommentsModal from '../components/reels/ReelsCommentsModal';

const TABS = [
  { id: 'foryou', label: 'Für dich' },
  { id: 'grows', label: 'Grows' },
  { id: 'following', label: 'Gefolgt' },
];

// Only render ±2 reels around current for performance
const RENDER_WINDOW = 2;

export default function Reels() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('foryou');
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);

  const containerRef = useRef(null);
  const viewTracked = useRef({});
  const lastTapRef = useRef(0);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await base44.functions.invoke('feed/getReelsFeed', {});
      const { posts: mediaPosts, users: userMap, currentUser: cu } = response.data || {};
      setCurrentUser(cu);
      setPosts(mediaPosts || []);
      setUsers(userMap || {});
    } catch (err) {
      console.error('Reels load:', err);
      setLoadError('Reels konnten nicht geladen werden. Bitte Verbindung prüfen und erneut versuchen.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const reels = useMemo(() => {
    let items = [];
    posts.forEach(post => {
      (post.media_urls || []).forEach((url, idx) => {
        if (!url) return;
        items.push({
          id: `${post.id}_${idx}`, postId: post.id, media: url, post,
          author: users[post.created_by] || users[post.created_by_id],
          isGrow: post.post_type === 'grow_diary_update' || post.category === 'grow_diary',
          sortDate: post.created_date,
        });
      });
    });
    items.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

    if (activeTab === 'grows') items = items.filter(r => r.isGrow);
    else if (activeTab === 'following') {
      const fol = currentUser?.following || [];
      if (fol.length) {
        const f = items.filter(r => fol.includes(r.post?.created_by));
        if (f.length) items = f;
      }
    }
    return items;
  }, [posts, users, activeTab, currentUser]);

  // Snap observer
  useEffect(() => {
    const c = containerRef.current;
    if (!c || !reels.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          const idx = Number(e.target.dataset.index);
          if (!isNaN(idx)) setCurrentIndex(idx);
        }
      });
    }, { root: c, threshold: 0.6 });
    c.querySelectorAll('[data-reel]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reels.length]);

  // Track views
  useEffect(() => {
    const reel = reels[currentIndex];
    if (!reel || viewTracked.current[reel.id]) return;
    viewTracked.current[reel.id] = true;
    if (reel.postId) {
      base44.entities.Post.update(reel.postId, { view_count: (reel.post.view_count || 0) + 1 }).catch(() => {});
    }
  }, [currentIndex, reels]);

  // Reset on tab
  useEffect(() => {
    setCurrentIndex(0);
    viewTracked.current = {};
    containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Double tap
  const handleDoubleTap = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      const reel = reels[currentIndex];
      if (reel && currentUser && reel.postId) {
        handleLike();
        setDoubleTapHeart(true);
        setTimeout(() => setDoubleTapHeart(false), 800);
      }
    }
    lastTapRef.current = now;
  }, [currentIndex, reels, currentUser]);

  const handleLike = useCallback(async () => {
    const reel = reels[currentIndex];
    if (!currentUser || !reel?.postId) return;
    const post = reel.post;
    const reactions = JSON.parse(JSON.stringify(post.reactions || {}));
    const like = reactions.like || { count: 0, users: [] };
    const had = like.users?.includes(currentUser.email);
    like.users = had ? like.users.filter(e => e !== currentUser.email) : [...(like.users || []), currentUser.email];
    like.count = like.users.length;
    reactions.like = like;
    setPosts(prev => prev.map(p => p.id === reel.postId ? { ...p, reactions } : p));
    if (navigator.vibrate) navigator.vibrate(5);
    base44.entities.Post.update(reel.postId, { reactions }).catch(() => {});
  }, [currentIndex, reels, currentUser]);

  const handleBookmark = useCallback(async () => {
    const reel = reels[currentIndex];
    if (!currentUser || !reel?.postId) return;
    const bm = reel.post.bookmarked_by_users || [];
    const was = bm.includes(currentUser.email);
    const updated = was ? bm.filter(e => e !== currentUser.email) : [...bm, currentUser.email];
    setPosts(prev => prev.map(p => p.id === reel.postId ? { ...p, bookmarked_by_users: updated } : p));
    base44.entities.Post.update(reel.postId, { bookmarked_by_users: updated }).catch(() => {});
    toast.success(was ? 'Entfernt' : 'Gespeichert');
  }, [currentIndex, reels, currentUser]);

  const handleShare = useCallback(() => {
    const reel = reels[currentIndex];
    const url = reel?.postId ? `${window.location.origin}/PostThread?id=${reel.postId}` : window.location.origin;
    if (navigator.share) navigator.share({ title: 'GrowHub', url }).catch(() => {});
    else { navigator.clipboard.writeText(url); toast.success('Link kopiert!'); }
  }, [currentIndex, reels]);

  const handleComment = useCallback(() => {
    if (!currentUser) { toast.error('Bitte melde dich an'); return; }
    const reel = reels[currentIndex];
    if (reel) { setSelectedPost(reel.post); setShowComments(true); }
  }, [currentIndex, reels, currentUser]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50" role="status" aria-live="polite" aria-busy="true">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" aria-hidden />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
        <button type="button" onClick={() => navigate(-1)} className="absolute top-5 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Zurück">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="gh-content-section max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Laden fehlgeschlagen</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button type="button" onClick={() => loadData()} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 text-black rounded-full font-bold text-sm">
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
            <button type="button" onClick={() => navigate('/Feed')} className="px-6 py-2.5 rounded-full border border-white/15 text-white text-sm font-medium hover:bg-white/5">
              Zum Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reels.length) {
    const tabHasNoMedia = posts.length > 0;
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 p-6">
        <button type="button" onClick={() => navigate(-1)} className="absolute top-5 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Zurück">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-5">
          <ImageIcon className="w-9 h-9 text-zinc-700" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          {tabHasNoMedia ? 'Keine Reels in diesem Tab' : 'Noch keine Reels'}
        </h2>
        <p className="text-zinc-500 text-sm text-center mb-6 max-w-xs">
          {tabHasNoMedia
            ? 'Wechsle den Tab oder schau später wieder vorbei.'
            : 'Teile Bilder oder Videos im Feed!'}
        </p>
        <button type="button" onClick={() => navigate('/Feed')} className="px-6 py-2.5 bg-green-500 text-black rounded-full font-bold text-sm">
          Zum Feed
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 select-none" onClick={handleDoubleTap}>
      {/* Top nav */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="bg-gradient-to-b from-black/60 to-transparent pb-4 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-3 pt-3 pointer-events-auto">
            <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5 text-white drop-shadow" />
            </button>
            <div className="flex items-center gap-6">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative pb-1">
                  <span className={`text-[14px] drop-shadow ${activeTab === tab.id ? 'text-white font-bold' : 'text-white/40 font-medium'}`}>
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <motion.span layoutId="reelTabIndicator" className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="w-9" />
          </div>
        </div>
      </div>

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reel counter */}
      <div className="absolute top-16 right-3 z-30 pointer-events-none">
        <span className="text-white/30 text-xs font-medium">{currentIndex + 1}/{reels.length}</span>
      </div>

      {/* Snap container - WINDOWED RENDERING */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ scrollSnapType: 'y mandatory', overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {reels.map((reel, index) => {
          const isNearCurrent = Math.abs(index - currentIndex) <= RENDER_WINDOW;
          
          return (
            <div
              key={reel.id}
              data-reel="true"
              data-index={index}
              className="relative snap-start snap-always"
              style={{ height: '100dvh', width: '100%' }}
            >
              {isNearCurrent ? (
                <>
                  <ReelItem
                    media={reel.media}
                    isActive={index === currentIndex}
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted(p => !p)}
                  />
                  <ReelOverlay
                    post={reel.post}
                    author={reel.author}
                    currentUser={currentUser}
                    isMuted={isMuted}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onComment={handleComment}
                    onShare={handleShare}
                    onToggleMute={() => setIsMuted(p => !p)}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          );
        })}
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && selectedPost && (
          <ReelsCommentsModal
            isOpen={showComments}
            onClose={() => { setShowComments(false); setSelectedPost(null); }}
            post={selectedPost}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}