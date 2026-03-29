import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, AlertCircle, Loader2 } from 'lucide-react';

const ReelsPlayer = React.forwardRef(({
  video,
  videoUrl,
  isActive,
  index,
  currentIndex,
  videoRef,
  isMuted,
  isPaused,
  playbackSpeed,
  loopCount,
  onLoop
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const internalVideoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef?.current || internalVideoRef?.current;
    if (!videoElement) return;

    const handleLoop = () => {
      onLoop();
      setVideoLoading(true);
    };

    const handleCanPlay = () => {
      setVideoLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('ended', handleLoop);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('ended', handleLoop);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [videoRef, onLoop]);

  useEffect(() => {
    const videoElement = videoRef?.current || internalVideoRef?.current;
    if (!videoElement) return;

    if (isActive && !isPaused) {
      videoElement.play().catch(() => {});
    } else {
      videoElement.pause();
    }
  }, [isActive, isPaused, videoRef]);

  const handleTapCenter = useCallback(() => {
    const videoElement = videoRef?.current || internalVideoRef?.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
    
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, [videoRef]);

  const handleVideoRetry = useCallback(() => {
    const videoElement = videoRef?.current || internalVideoRef?.current;
    if (videoElement) {
      setVideoLoading(true);
      setVideoError(false);
      videoElement.load();
    }
  }, [videoRef]);

  return (
    <motion.div
      key={video.id}
      initial={{ opacity: 0, scale: 0.95, y: index > currentIndex ? '100%' : '-100%' }}
      animate={{ 
        opacity: isActive ? 1 : 0,
        scale: isActive ? 1 : 0.95,
        y: isActive ? 0 : index > currentIndex ? '100%' : '-100%'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.5 }}
      className="absolute inset-0"
      style={{ zIndex: isActive ? 10 : 5 }}
    >
      <div className="w-full h-full relative bg-black" onClick={handleTapCenter}>
        <video
          ref={videoRef || internalVideoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          playsInline
          muted={isMuted}
          preload="metadata"
          poster={video.thumbnail_url}
          style={{ backgroundColor: '#000' }}
          onError={() => setVideoError(true)}
          onLoadedData={() => setVideoLoading(false)}
        />

        {/* Loading state */}
        {videoLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-sm text-center">Video konnte nicht geladen werden</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVideoRetry();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Play/Pause indicator center */}
        {!videoError && showControls && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </motion.div>
        )}

        {/* Loop counter */}
        {loopCount > 1 && (
          <div className="absolute top-24 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-bold">
            🔁 {loopCount}
          </div>
        )}
      </div>
    </motion.div>
  );
});

ReelsPlayer.displayName = 'ReelsPlayer';

export default ReelsPlayer;