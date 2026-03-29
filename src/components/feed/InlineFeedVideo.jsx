import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InlineFeedVideo({ src, onClick }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const controlsTimerRef = useRef(null);

  // IntersectionObserver: autoplay when ≥50% visible
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          video.muted = false;
          video.play().then(() => {
            setIsPlaying(true);
            setHasStarted(true);
            setIsMuted(false);
          }).catch(() => {
            // Browser blocks unmuted autoplay — fallback to muted
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => {
              setIsPlaying(true);
              setHasStarted(true);
            }).catch(() => {});
          });
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [src]);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleTap = useCallback((e) => {
    e.stopPropagation();
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  const handleKeyboard = useCallback((e) => {
    const video = videoRef.current;
    if (!video) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      video.muted = !video.muted;
      setIsMuted(video.muted);
      return;
    }

    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onClick && onClick();
    }
  }, [onClick]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onPlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
    };
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-pointer bg-black"
      style={{ maxHeight: 500 }}
      onClick={handleTap}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      onMouseMove={handleTap}
      onKeyDown={handleKeyboard}
      tabIndex={0}
      role="button"
      aria-label="Inline-Video öffnen oder steuern"
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full object-cover"
        style={{ maxHeight: 500 }}
        playsInline
        loop
        preload="auto"
        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
      />

      {/* Play overlay (before first play) */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="w-16 h-16 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap controls overlay */}
      <AnimatePresence>
        {showControls && hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Center play/pause */}
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              {isPlaying
                ? <div className="flex gap-1"><div className="w-1.5 h-6 bg-white rounded-full" /><div className="w-1.5 h-6 bg-white rounded-full" /></div>
                : <Play className="w-6 h-6 text-white ml-1" />
              }
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-white" />
                : <Volume2 className="w-4 h-4 text-white" />
              }
            </button>

            {/* Fullscreen hint */}
            <button
              onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
              className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium"
            >
              Vollbild
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}