import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Map, BookOpen, Users } from "lucide-react";

export default function OnboardingTour() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const seen = localStorage.getItem("gh_onboarding_done");
    if (!seen) setTimeout(() => setOpen(true), 600);
  }, []);

  const close = () => {
    localStorage.setItem("gh_onboarding_done", "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="glass-effect max-w-lg w-full p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Willkommen bei GrowHub</h3>
            </div>
            <ul className="space-y-3 text-zinc-300 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-green-400">•</span>
                Entdecke den Feed im Vollbild – wische durch Videos und Posts, like und kommentiere mit einem Tap.
              </li>
              <li className="flex items-start gap-3">
                <Map className="w-4 h-4 mt-0.5 text-green-400" />
                Karte: Tippe für Vollbild. Filtere Layer und finde Clubs, No-Go-Zonen und Smoke Areas.
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-4 h-4 mt-0.5 text-green-400" />
                Gruppen: Tritt spannenden Communities bei und teile deinen Fortschritt.
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 mt-0.5 text-green-400" />
                Wissen: Lerne mit strukturierten Artikeln – Markdown, Tags, Schwierigkeitsgrade.
              </li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={close}
                className="px-4 py-2 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800/60"
              >
                Später
              </button>
              <button
                onClick={close}
                className="px-4 py-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-black font-semibold"
              >
                Los geht's
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}