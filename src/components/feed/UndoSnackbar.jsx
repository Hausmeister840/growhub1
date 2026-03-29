import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';

export default function UndoSnackbar({ message, onUndo, onDismiss, duration = 6000 }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) {
        clearInterval(interval);
        setVisible(false);
        onDismissRef.current?.();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  if (!visible) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm"
      >
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-300">{message}</span>
            <button
              onClick={() => {
                setVisible(false);
                onUndo?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-semibold transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
          <div className="h-[2px] bg-zinc-800">
            <div
              className="h-full bg-green-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}