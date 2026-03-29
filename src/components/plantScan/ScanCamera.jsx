import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, SwitchCamera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScanCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('loading'); // loading, ready, error
  const [facingMode, setFacingMode] = useState('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('loading');
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false
      });

      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      // Wait for video to actually have data before marking ready
      await new Promise((resolve, reject) => {
        const onPlaying = () => { cleanup(); resolve(); };
        const onError = (e) => { cleanup(); reject(e); };
        const cleanup = () => {
          video.removeEventListener('playing', onPlaying);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('playing', onPlaying, { once: true });
        video.addEventListener('error', onError, { once: true });

        video.play().catch(reject);

        // Timeout fallback after 5s
        setTimeout(() => { cleanup(); resolve(); }, 5000);
      });

      if (mountedRef.current) setCameraState('ready');
    } catch (err) {
      console.warn('Camera error:', err);
      if (mountedRef.current) setCameraState('error');
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, [startCamera, stopStream]);

  const capturePhoto = useCallback(() => {
    if (cameraState === 'loading') return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    // If video has no dimensions yet, fall back to file picker
    if (!video.videoWidth || video.videoWidth === 0) {
      fileInputRef.current?.click();
      return;
    }
    
    setIsCapturing(true);
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) { setIsCapturing(false); return; }
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      onCapture(file, previewUrl);
      setIsCapturing(false);
    }, 'image/jpeg', 0.95);
  }, [onCapture, cameraState]);

  const toggleFacing = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  // Fallback for devices without camera
  if (cameraState === 'error') {
    return (
      <div className="mx-4 aspect-[3/4] bg-zinc-900 rounded-3xl flex flex-col items-center justify-center gap-4 border border-white/[0.06]">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file, URL.createObjectURL(file));
        }} className="hidden" />
        <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center">
          <Camera className="w-10 h-10 text-zinc-500" />
        </div>
        <p className="text-zinc-500 text-sm text-center px-6">Kamerazugriff nicht verfügbar.<br/>Bitte erlaube den Zugriff in den Browser-Einstellungen.</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-green-500 text-black font-bold rounded-2xl text-sm"
        >
          Foto aus Galerie wählen
        </button>
        <button
          onClick={startCamera}
          className="px-6 py-2.5 bg-white/[0.06] text-zinc-300 font-medium rounded-2xl text-sm border border-white/[0.08]"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-4 aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-white/[0.06]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ background: '#000' }}
      />
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onCapture(file, URL.createObjectURL(file));
      }} className="hidden" />

      {/* Loading overlay while camera initializes */}
      {cameraState === 'loading' && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-xs font-medium">Kamera wird gestartet…</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 px-5 py-2.5 bg-green-500 text-black font-bold rounded-2xl text-sm"
          >
            Foto aus Galerie wählen
          </button>
        </div>
      )}

      {/* Scan guide overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-8 border-2 border-green-500/20 rounded-3xl" />
        {/* Corner markers */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-green-500/60 rounded-tl-xl" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-green-500/60 rounded-tr-xl" />
        <div className="absolute bottom-20 left-6 w-8 h-8 border-b-2 border-l-2 border-green-500/60 rounded-bl-xl" />
        <div className="absolute bottom-20 right-6 w-8 h-8 border-b-2 border-r-2 border-green-500/60 rounded-br-xl" />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleFacing}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <SwitchCamera className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Capture button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={capturePhoto}
          disabled={isCapturing || cameraState === 'loading'}
          className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full border-[3px] border-white/80" />
          <div className={`w-[58px] h-[58px] rounded-full transition-all ${isCapturing ? 'bg-red-500 scale-75' : 'bg-white'}`} />
        </motion.button>
      </div>

      {/* Hint */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <span className="text-xs text-white/60 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full font-medium">
          Pflanze zentrieren
        </span>
      </div>
    </div>
  );
}