import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import VideoControls from '@/components/media/VideoControls';

export default function ImmersiveMediaViewer({ 
  isOpen, 
  onClose, 
  post, 
  initialIndex = 0 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const fullscreenRef = useRef(null);

  const mediaUrls = React.useMemo(() => {
    if (!post) return [];
    if (Array.isArray(post.media_urls) && post.media_urls.length > 0) return post.media_urls;
    if (post.data && Array.isArray(post.data.media_urls)) return post.data.media_urls;
    return [];
  }, [post]);

  const currentUrl = mediaUrls[currentIndex] || '';
  const isVideo = currentUrl && (/\.(mp4|webm|mov|avi|m4v)$/i.test(currentUrl) || currentUrl.includes('/video/'));

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, post?.id]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setVideoLoading(true);
    setVideoError(false);
    setIsPlaying(true);
  }, [currentIndex]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (mediaUrls.length > 1) {
        if (e.key === 'ArrowLeft') setCurrentIndex(i => i > 0 ? i - 1 : mediaUrls.length - 1);
        if (e.key === 'ArrowRight') setCurrentIndex(i => i < mediaUrls.length - 1 ? i + 1 : 0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, mediaUrls.length]);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartRef.current === null || mediaUrls.length <= 1) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        setCurrentIndex(i => i < mediaUrls.length - 1 ? i + 1 : 0);
      } else {
        setCurrentIndex(i => i > 0 ? i - 1 : mediaUrls.length - 1);
      }
    }
    touchStartRef.current = null;
  }, [mediaUrls.length]);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${currentIndex + 1}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download gestartet');
    } catch {
      toast.error('Download fehlgeschlagen');
    }
  };

  const handleBackdropClick = useCallback((e) => {
    // Close only if clicking the backdrop, not the media
    if (e.target === containerRef.current) {
      onClose();
    }
  }, [onClose]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef?.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (!fullscreenRef?.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await fullscreenRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  }, []);

  const handleVideoRetry = useCallback(() => {
    if (videoRef?.current) {
      setVideoLoading(true);
      setVideoError(false);
      videoRef.current.load();
    }
  }, []);

  if (!isOpen || mediaUrls.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black"
      style={{ zIndex: 99999 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition-transform"
          aria-label="Schließen"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          {mediaUrls.length > 1 && (
            <span className="text-white/80 text-xs font-medium px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              {currentIndex + 1} / {mediaUrls.length}
            </span>
          )}
          <button
            onClick={handleDownload}
            className="p-2.5 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition-transform"
            aria-label="Herunterladen"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleBackdropClick}
      >
        {/* Loading spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {(imageError || videoError) && (
          <div className="text-center text-zinc-400 space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500/50" />
            <p className="mb-2">
              {isVideo ? 'Video konnte nicht geladen werden' : 'Bild konnte nicht geladen werden'}
            </p>
            {isVideo && (
              <button
                onClick={handleVideoRetry}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                Erneut versuchen
              </button>
            )}
            <p className="text-xs text-zinc-600 break-all px-8">{currentUrl}</p>
          </div>
        )}

        {isVideo ? (
          <div ref={fullscreenRef} className="absolute inset-0 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              key={currentUrl}
              src={currentUrl}
              playsInline
              className="max-w-full max-h-full object-contain"
              onCanPlay={() => setVideoLoading(false)}
              onLoadedData={() => setImageLoaded(true)}
              onError={() => { 
                setVideoLoading(false);
                setImageLoaded(true);
                setVideoError(true);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!videoError && <VideoControls 
              videoRef={videoRef}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              duration={videoRef?.current?.duration || 0}
              onFullscreen={handleFullscreen}
            />}
          </div>
        ) : (
          <img
            key={currentUrl}
            src={currentUrl}
            alt="Media"
            className="max-w-full max-h-full object-contain"
            style={{ 
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
            onLoad={() => { setImageLoaded(true); setImageError(false); }}
            onError={() => { setImageLoaded(true); setImageError(true); }}
            draggable={false}
          />
        )}
      </div>

      {/* Desktop nav arrows */}
      {mediaUrls.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(i => i > 0 ? i - 1 : mediaUrls.length - 1)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur rounded-full hover:bg-black/70 transition z-20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => setCurrentIndex(i => i < mediaUrls.length - 1 ? i + 1 : 0)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur rounded-full hover:bg-black/70 transition z-20"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {mediaUrls.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
          {mediaUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}