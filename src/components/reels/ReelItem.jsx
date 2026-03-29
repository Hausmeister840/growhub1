import { useRef, useEffect, useState } from 'react';

function isVideo(url) {
  return url && /\.(mp4|webm|mov)($|\?)/i.test(url);
}

export default function ReelItem({ media, isActive, isMuted, onToggleMute }) {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const isVideoMedia = isVideo(media);
  const progressInterval = useRef(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !isVideoMedia) return;

    if (isActive) {
      vid.muted = isMuted;
      vid.play().catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });
      progressInterval.current = setInterval(() => {
        if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100);
      }, 100);
    } else {
      vid.pause();
      vid.currentTime = 0;
      setProgress(0);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isActive, isMuted, isVideoMedia]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !isVideoMedia) return;
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('playing', onPlaying);
    return () => {
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('playing', onPlaying);
    };
  }, [isVideoMedia]);

  const handleTap = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    if (isVideoMedia && onToggleMute) onToggleMute();
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative" onClick={handleTap}>
      {isVideoMedia ? (
        <video
          ref={videoRef}
          src={media}
          className="w-full h-full object-cover"
          loop playsInline muted={isMuted}
          preload={isActive ? "auto" : "metadata"}
        />
      ) : (
        <img
          src={media}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
          style={isActive ? { animation: 'kenburns 8s ease-in-out infinite alternate' } : undefined}
        />
      )}

      {/* Ken Burns keyframes for images */}
      {!isVideoMedia && isActive && (
        <style>{`@keyframes kenburns { from { transform: scale(1) translate(0,0); } to { transform: scale(1.08) translate(-1%,-1%); }}`}</style>
      )}

      {/* Buffering */}
      {isBuffering && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Mute indicator flash */}
      {isVideoMedia && isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          {/* Shown briefly via CSS on mute toggle — handled by parent */}
        </div>
      )}

      {/* Video progress */}
      {isVideoMedia && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <div className="h-full bg-white/60 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}