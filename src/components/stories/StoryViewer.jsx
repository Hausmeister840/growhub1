import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Send, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function StoryViewer({ stories, onClose, currentUser }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const timerRef = useRef(null);
  const mediaRef = useRef(null);
  const story = stories[currentIndex];
  const userEmail = story?.created_by;
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (userEmail) {
      base44.entities.User.filter({ email: userEmail })
        .then(users => setUser(users[0] || null))
        .catch(() => setUser(null));
    }
  }, [userEmail]);

  useEffect(() => {
    if (isPaused || !story) return;

    const duration = story?.media_type === 'video' ? 15000 : (story?.duration_seconds || 5) * 1000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused, story]);

  useEffect(() => {
    if (story && currentUser) {
      markAsViewed();
    }
  }, [story, currentUser]);

  const markAsViewed = async () => {
    if (!story || !currentUser) return;
    try {
      const views = story.views || [];
      if (!views.includes(currentUser.email)) {
        await base44.entities.Story.update(story.id, {
          views: [...views, currentUser.email]
        });
      }
    } catch (error) {
      console.error('Mark viewed error:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setMediaLoading(true);
      setMediaError(false);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setMediaLoading(true);
      setMediaError(false);
    }
  };

  const handleMediaRetry = useCallback(() => {
    setMediaLoading(true);
    setMediaError(false);
    if (mediaRef?.current) {
      mediaRef.current.load();
    }
  }, []);

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    
    try {
      const replies = story.replies || [];
      await base44.entities.Story.update(story.id, {
        replies: [
          ...replies,
          {
            user_email: currentUser.email,
            message: replyText.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      });
      setReplyText('');
      toast.success('Antwort gesendet!');
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black"
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
              {user?.full_name?.[0] || userEmail?.[0] || '?'}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">{user?.full_name || userEmail}</p>
            <p className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(story.created_date), { addSuffix: true, locale: de })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black"
        onClick={() => setIsPaused(!isPaused)}
      >
        {mediaLoading && !mediaError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}

        {mediaError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-sm">Inhalt konnte nicht geladen werden</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMediaRetry();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {!mediaError && (
          <>
            {story.media_type === 'video' ? (
              <video
                ref={mediaRef}
                src={story.media_url}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
                onCanPlay={() => setMediaLoading(false)}
                onError={() => {
                  setMediaLoading(false);
                  setMediaError(true);
                }}
              />
            ) : (
              <img
                ref={mediaRef}
                src={story.media_url}
                alt="Story"
                className="w-full h-full object-contain"
                onLoad={() => setMediaLoading(false)}
                onError={() => {
                  setMediaLoading(false);
                  setMediaError(true);
                }}
                draggable={false}
              />
            )}

            {story.text_overlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white text-2xl font-bold text-center px-8 drop-shadow-lg">
                  {story.text_overlay}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={currentIndex === 0}
        aria-label="Vorherige Story"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label="Nächste Story"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Reply */}
      {userEmail !== currentUser?.email && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Antworten..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            />
            <Button onClick={handleReply} size="icon" className="bg-white/20 hover:bg-white/30">
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}