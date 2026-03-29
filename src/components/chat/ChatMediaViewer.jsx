import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, AlertCircle } from 'lucide-react';
import VideoControls from '@/components/media/VideoControls';

export default function ChatMediaViewer({ media, allMedia = [], currentIndex = 0, onClose }) {
  const [index, setIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const fullscreenRef = useRef(null);
  const currentMedia = allMedia.length > 0 ? allMedia[index] : media;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) {
        setIndex(index - 1);
        setZoom(1);
        setVideoError(false);
      }
      if (e.key === 'ArrowRight' && index < allMedia.length - 1) {
        setIndex(index + 1);
        setZoom(1);
        setVideoError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, allMedia.length, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media_${Date.now()}.${currentMedia.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

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

  const handlePinch = useCallback((e) => {
    if (currentMedia.type !== 'image' || e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    return distance;
  }, [currentMedia.type]);

  if (!currentMedia) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            {allMedia.length > 1 && (
              <span className="text-white font-medium">
                {index + 1} / {allMedia.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentMedia.type === 'image' && (
              <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom(Math.max(0.5, zoom - 0.25));
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Verkleinern"
                  >
                    <ZoomOut className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom(Math.min(3, zoom + 0.25));
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Vergrößern"
                  >
                    <ZoomIn className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {currentMedia.type === 'video' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullscreen();
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Vollbild"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        {allMedia.length > 1 && (
          <>
            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(index - 1);
                  setZoom(1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            {index < allMedia.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(index + 1);
                  setZoom(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </>
        )}

        {/* Media Content */}
        <div 
          className="absolute inset-0 flex items-center justify-center p-16"
          onClick={(e) => e.stopPropagation()}
        >
          {currentMedia.type === 'image' ? (
            <motion.img
              key={currentMedia.url}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: zoom, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={currentMedia.url}
              alt="Media"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ 
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-out'
              }}
              draggable={false}
            />
          ) : currentMedia.type === 'video' ? (
            <div ref={fullscreenRef} className="relative w-full max-h-full bg-black rounded-lg overflow-hidden" style={{ maxHeight: '85vh', maxWidth: '90vw' }}>
              <motion.video
                ref={videoRef}
                key={currentMedia.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={currentMedia.url}
                playsInline
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setVideoError(true)}
              />
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <p className="text-sm">Video konnte nicht geladen werden</p>
                </div>
              ) : (
                <VideoControls 
                  videoRef={videoRef}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  duration={videoRef?.current?.duration || 0}
                  onFullscreen={handleFullscreen}
                />
              )}
            </div>
          ) : null}
        </div>

        {/* Thumbnails */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
              {allMedia.map((item, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(idx);
                    setZoom(1);
                  }}
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                    ${idx === index ? 'border-green-500 scale-110' : 'border-white/20 hover:border-white/40'}
                  `}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-2xl">▶️</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}