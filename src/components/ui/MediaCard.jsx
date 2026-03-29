import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const isVideoUrl = (url = "") => /\.(mp4|webm|mov|avi)$/i.test(url);

export default function MediaCard({
  id,
  type,
  hlsUrl,
  imageUrl,
  thumbUrl,
  muted = true,
  visible = false,
  onToggleMute,
  onDoubleLike,
  onVideoError,
  onVideoReady
}) {
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      if (visible && !hasError) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((error) => {
            console.error('Video play failed:', error);
            // Try with muted if autoplay fails
            videoRef.current.muted = true;
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
                if (onToggleMute) onToggleMute(true);
              })
              .catch(() => {
                setHasError(true);
                setIsLoading(false);
                if (onVideoError) onVideoError(id, error);
              });
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [visible, type, hasError, id, onToggleMute, onVideoError]);

  // Handle muted state changes
  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted, type]);

  // Double-tap detection with haptic feedback
  const handleTap = (e) => {
    e.preventDefault();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap - trigger like
      handleDoubleLike();
    } else {
      // Single tap - toggle mute for videos
      if (type === 'video' && onToggleMute) {
        onToggleMute(!muted);
      }
    }
    lastTap.current = now;
  };

  const handleDoubleLike = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1200);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]); // Triple vibration for like
    }

    if (onDoubleLike) {
      onDoubleLike(id);
    }
  };

  const handleVideoLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    if (onVideoReady) {
      onVideoReady(id);
    }
  };

  const handleVideoError = (error) => {
    setHasError(true);
    setIsLoading(false);
    if (onVideoError) {
      onVideoError(id, error);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Get the media source URL
  const mediaUrl = type === 'video' ? (hlsUrl || imageUrl) : imageUrl;
  const posterUrl = thumbUrl || imageUrl;

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
      {/* Media Content */}
      {type === 'video' ? (
        <div className="w-full h-full relative">
          {/* Video Element */}
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={posterUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onClick={handleTap}
            style={{ 
              display: hasError ? 'none' : 'block',
              cursor: 'pointer' 
            }}
          />

          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-white"
              >
                <RefreshCw className="w-8 h-8" />
              </motion.div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4">
              <div className="text-center">
                <p className="mb-4 text-gray-300">Video konnte nicht geladen werden</p>
                <Button
                  onClick={handleRetry}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            </div>
          )}

          {/* Mute/Unmute Visual Indicator */}
          <AnimatePresence>
            {visible && !hasError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleMute) onToggleMute(!muted);
                  }}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Image Display
        <img
          ref={imageRef}
          src={mediaUrl}
          alt="Media content"
          className="w-full h-full object-cover cursor-pointer"
          onClick={handleTap}
          onLoad={() => {
            setIsLoading(false);
            if (onVideoReady) onVideoReady(id);
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}

      {/* Double-tap Heart Animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 1.2,
              times: [0, 0.3, 1],
              ease: "easeInOut"
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <Heart className="w-24 h-24 text-red-500 fill-current drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state for images */}
      {type === 'image' && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-white"
          >
            <RefreshCw className="w-6 h-6" />
          </motion.div>
        </div>
      )}

      {/* Error state for images */}
      {type === 'image' && hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <p className="text-gray-400 text-sm">Bild konnte nicht geladen werden</p>
        </div>
      )}
    </div>
  );
}