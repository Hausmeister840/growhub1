import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scan, X, Maximize } from 'lucide-react';
import { toast } from 'sonner';

export default function ARContentOverlay({ post, onClose }) {
  const [arSupported, setArSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);

  useEffect(() => {
    setArSupported('xr' in navigator);
  }, []);

  const activateAR = async () => {
    if (!arSupported) {
      toast.info('AR wird auf diesem Gerät nicht unterstützt');
      return;
    }

    try {
      setIsARActive(true);
      toast.success('AR-Modus aktiviert - Richte Kamera auf flache Oberfläche');
    } catch (error) {
      toast.error('AR konnte nicht gestartet werden');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[999] flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Scan className="w-5 h-5 text-green-400" />
          AR Ansicht
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {!isARActive ? (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center">
              <Maximize className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Erweiterte Realität</h2>
            <p className="text-zinc-400 max-w-md">
              Erlebe diesen Post in deinem Raum mit Augmented Reality
            </p>
            <button
              onClick={activateAR}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-2xl font-bold shadow-xl shadow-green-500/30"
            >
              AR aktivieren
            </button>
          </div>
        ) : (
          <div className="w-full h-full bg-zinc-900 rounded-3xl flex items-center justify-center border-2 border-dashed border-green-500/30">
            <p className="text-zinc-500 text-center">
              AR-Kamera wird geladen...<br/>
              <span className="text-xs">Richte dein Gerät auf eine flache Oberfläche</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}