import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoControls({ 
  videoRef, 
  isPlaying, 
  onPlayPause, 
  duration = 0, 
  onFullscreen,
  hideTimeout = 3000 
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef?.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [videoRef]);

  const syncFromVideo = useCallback(() => {
    if (!videoRef?.current) return;
    const video = videoRef.current;
    setCurrentTime(Number.isFinite(video.currentTime) ? video.currentTime : 0);
    setIsMuted(Boolean(video.muted));
    setPlaybackSpeed(Number.isFinite(video.playbackRate) ? video.playbackRate : 1);
  }, [videoRef]);

  const handleSeek = useCallback((e) => {
    if (!videoRef?.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, [videoRef, duration]);

  const handleMute = useCallback(() => {
    if (videoRef?.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [videoRef, isMuted]);

  const handleSpeedChange = useCallback((speed) => {
    if (videoRef?.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  }, [videoRef]);

  const handleMouseMove = useCallback(() => {
    setIsHovering(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsHovering(false), hideTimeout);
  }, [hideTimeout]);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return undefined;

    syncFromVideo();
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', syncFromVideo);
    video.addEventListener('loadedmetadata', syncFromVideo);
    video.addEventListener('volumechange', syncFromVideo);
    video.addEventListener('ratechange', syncFromVideo);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', syncFromVideo);
      video.removeEventListener('loadedmetadata', syncFromVideo);
      video.removeEventListener('volumechange', syncFromVideo);
      video.removeEventListener('ratechange', syncFromVideo);
    };
  }, [videoRef, handleTimeUpdate, syncFromVideo]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatTime = (time) => {
    if (!time || !Number.isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsHovering(false), hideTimeout);
      }}
    >
      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        className="w-full cursor-pointer pointer-events-auto px-4 pb-2"
        onClick={handleSeek}
      >
        <div className="relative h-1 bg-white/30 rounded-full group hover:h-1.5 transition-all">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {isHovering && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0.3 }}
        className="flex items-center justify-between px-4 py-3 pointer-events-auto gap-2"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={handleMute}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <span className="text-xs text-white/70 font-mono w-12 text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <div className="relative group">
            <button
              className="text-xs text-white/70 hover:text-white px-2 py-1 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {playbackSpeed}x
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col bg-black/90 rounded-lg py-1 z-50">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeedChange(speed);
                  }}
                  className={`px-3 py-1 text-sm transition-colors ${
                    playbackSpeed === speed
                      ? 'text-green-500 font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}