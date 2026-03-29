
import { useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import PostDetailModal from "./types/PostDetailModal";
import ArticleDetailModal from "./types/ArticleDetailModal";
import GroupDetailModal from "./types/GroupDetailModal";
import ProductDetailModal from "./types/ProductDetailModal";
import DiaryDetailModal from "./types/DiaryDetailModal";
import UnifiedMediaViewer from "@/components/viewer/UnifiedMediaViewer";

export default function FullscreenModal({ type, data, onClose }) {
  const overlayRef = useRef(null);

  const handleClose = useCallback(() => {
    if (typeof onClose === "function") onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const stop = (e) => e.stopPropagation();

  const renderContent = () => {
    // Never access properties directly on possibly null data here
    const safeData = data || {};
    switch (type) {
      case "post":
        return <PostDetailModal data={safeData} />;
      case "article":
        return <ArticleDetailModal data={safeData} />;
      case "group":
        return <GroupDetailModal data={safeData} />;
      case "product":
        return <ProductDetailModal data={safeData} />;
      case "diary":
        return <DiaryDetailModal data={safeData} />;
      case "media":
        return <UnifiedMediaViewer data={safeData} onClose={handleClose} />;
      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-zinc-100 text-lg font-semibold mb-2">Nichts zu anzeigen</h3>
            <p className="text-zinc-400 text-sm">Dieser Inhalt ist nicht verfügbar.</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {!!type && (
        <motion.div
          ref={overlayRef}
          key="overlay"
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key="dialog"
            className="relative w-[96vw] h-[96vh] md:w-[90vw] md:h-[90vh] lg:w-[72vw] lg:h-[80vh] xl:w-[62vw] xl:h-[78vh] rounded-3xl bg-zinc-950/90 border border-zinc-800/60 overflow-hidden shadow-2xl"
            initial={{ y: 30, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            onClick={stop}
            role="dialog"
            aria-modal="true"
          >
            <button
              aria-label="Schließen"
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20 backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
