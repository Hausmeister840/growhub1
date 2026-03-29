import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function BioMetricContentGating({ post, children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [heartRate, setHeartRate] = useState(null);

  const requiresBioMetric = post.bio_metric_gated || false;
  const requiredHeartRate = post.required_heart_rate || { min: 60, max: 100 };

  const checkBioMetrics = async () => {
    toast.info('Biometrische Authentifizierung...');
    
    // Simulate biometric check
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const simulatedHR = 70 + Math.floor(Math.random() * 30);
    setHeartRate(simulatedHR);

    if (simulatedHR >= requiredHeartRate.min && simulatedHR <= requiredHeartRate.max) {
      setIsUnlocked(true);
      toast.success('Zugriff gewährt! ✓');
    } else {
      toast.error('Herzfrequenz außerhalb des erforderlichen Bereichs');
    }
  };

  if (!requiresBioMetric || isUnlocked) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[300px] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 rounded-3xl" />
      
      <div className="text-center space-y-6 relative z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-red-400" />
        </motion.div>

        <div>
          <h3 className="text-white font-bold text-lg mb-2">
            Biometrischer Zugriff erforderlich
          </h3>
          <p className="text-zinc-400 text-sm">
            Dieser Inhalt ist gesperrt für optimales Viewing-Erlebnis
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Herzfrequenz: {requiredHeartRate.min}-{requiredHeartRate.max} BPM
          </p>
        </div>

        <button
          onClick={checkBioMetrics}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-red-500/30"
        >
          <Heart className="w-5 h-5" />
          Biometrisch entsperren
        </button>

        {heartRate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-zinc-500"
          >
            <Activity className="w-4 h-4" />
            Gemessen: {heartRate} BPM
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}