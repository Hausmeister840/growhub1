import { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { isVideoUrl } from '@/components/utils/media';

export default function FullscreenMediaViewer({ isOpen, onClose, post, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDismissDragging, setIsDismissDragging] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const videoRef = useRef(null);
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    axis: null,
  });

  const mediaUrls = post?.media_urls || [];
  const currentUrl = mediaUrls[currentIndex];
  const isVideo = isVideoUrl(currentUrl);
  const isSingle = mediaUrls.length <= 1;

  const backgroundOpacity = useMemo(() => {
    const opacity = 1 - Math.min(Math.abs(dragY) / 360, 0.65);
    return Math.max(opacity, 0.2);
  }, [dragY]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, post?.id]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && mediaUrls.length > 1) 
        setCurrentIndex(i => i > 0 ? i - 1 : mediaUrls.length - 1);
      if (e.key === 'ArrowRight' && mediaUrls.length > 1) 
        setCurrentIndex(i => i < mediaUrls.length - 1 ? i + 1 : 0);
      if (isVideo && videoRef.current && (e.key === ' ' || e.key === 'k')) {
        e.preventDefault();
        if (videoRef.current.paused) videoRef.current.play().catch(() => {});
        else videoRef.current.pause();
      }
      if (isVideo && videoRef.current && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        videoRef.current.muted = !videoRef.current.muted;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaUrls.length, onClose, isVideo]);

  useEffect(() => {
    if (!isOpen || !currentUrl) return;
    setIsLoading(true);
    setDragY(0);
    setIsDismissDragging(false);
  }, [isOpen, currentUrl]);

  const goPrev = () => setCurrentIndex((i) => (i > 0 ? i - 1 : mediaUrls.length - 1));
  const goNext = () => setCurrentIndex((i) => (i < mediaUrls.length - 1 ? i + 1 : 0));

  const resetGesture = () => {
    gestureRef.current = { startX: 0, startY: 0, axis: null };
    setIsPointerActive(false);
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const blocked = e.target.closest('button, a, [data-no-swipe="true"]');
    if (blocked) return;
    gestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      axis: null,
    };
    setIsPointerActive(true);
  };

  const handlePointerMove = (e) => {
    if (!isPointerActive) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;

    if (!gestureRef.current.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      gestureRef.current.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    }

    if (gestureRef.current.axis === 'y') {
      if (dy > 0) {
        setIsDismissDragging(true);
        setDragY(dy);
      }
    } else if (!isSingle) {
      // Horizontal swipe should not scroll the page while interacting with media.
      e.preventDefault();
    }
  };

  const handlePointerEnd = (e) => {
    if (!isPointerActive) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;
    const axis = gestureRef.current.axis;

    if (axis === 'y') {
      if (dy > 120) {
        onClose();
      } else {
        setIsDismissDragging(false);
        setDragY(0);
      }
    }

    if (axis === 'x' && !isSingle && Math.abs(dx) > 70) {
      if (dx < 0) goNext();
      else goPrev();
    }

    if (axis !== 'y') {
      setIsDismissDragging(false);
      setDragY(0);
    }

    resetGesture();
  };

  const handleDownload = async () => {
    try {
      const a = document.createElement('a');
      const extension = isVideo ? 'mp4' : 'jpg';
      a.href = currentUrl;
      a.download = `media-${currentIndex + 1}.${extension}`;
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download gestartet');
    } catch {
      toast.error('Download fehlgeschlagen');
    }
  };

  if (!isOpen || !currentUrl) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[99999] flex h-screen w-screen flex-col bg-black/95"
      style={{ opacity: backgroundOpacity }}
    >
      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
          data-no-swipe="true"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
          <span className="text-white/95 text-xs font-semibold tracking-wide">
            {currentIndex + 1} / {mediaUrls.length}
          </span>
        </div>
        <button
          onClick={handleDownload}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
          data-no-swipe="true"
        >
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div
        className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div
          className={`transition-transform ${isDismissDragging ? '' : 'duration-300 ease-out'}`}
          style={{ transform: `translateY(${Math.max(0, dragY)}px) scale(${1 - Math.min(Math.max(dragY, 0) / 2800, 0.08)})` }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentUrl}
              playsInline
              controls
              autoPlay
              data-no-swipe="true"
              className="max-w-full max-h-[86vh] object-contain rounded-2xl"
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (videoRef.current?.paused) videoRef.current.play().catch(() => {});
                else videoRef.current?.pause();
              }}
            />
          ) : (
            <img
              src={currentUrl}
              alt="Media"
              className="max-w-full max-h-[86vh] object-contain rounded-2xl select-none"
              draggable={false}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      {mediaUrls.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 items-center justify-center bg-white/12 hover:bg-white/25 border border-white/20 rounded-full backdrop-blur-md transition-colors"
            data-no-swipe="true"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={goNext}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 items-center justify-center bg-white/12 hover:bg-white/25 border border-white/20 rounded-full backdrop-blur-md transition-colors"
            data-no-swipe="true"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 flex gap-2 px-4 py-2 bg-black/45 border border-white/10 backdrop-blur-md rounded-full">
            {mediaUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                data-no-swipe="true"
                className={`rounded-full transition-all ${
                  i === currentIndex ? 'bg-white w-4 h-2' : 'bg-white/35 w-2 h-2'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}