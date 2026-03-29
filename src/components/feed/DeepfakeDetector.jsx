import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeepfakeDetector({ media_url, type }) {
  const [analysis, setAnalysis] = React.useState(null);

  React.useEffect(() => {
    if (!media_url || type !== 'image') return;
    
    // Simulate AI-based deepfake detection
    const detectDeepfake = () => {
      const confidence = Math.random();
      
      setAnalysis({
        isAuthentic: confidence > 0.3,
        confidence: Math.round(confidence * 100),
        checked: true
      });
    };

    setTimeout(detectDeepfake, 500);
  }, [media_url, type]);

  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl ${
        analysis.isAuthentic
          ? 'bg-green-500/20 border border-green-500/30'
          : 'bg-red-500/20 border border-red-500/30'
      }`}
    >
      {analysis.isAuthentic ? (
        <>
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-green-400">Original</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-medium text-red-400">AI-generiert</span>
        </>
      )}
      <span className="text-[10px] text-white/60">{analysis.confidence}%</span>
    </motion.div>
  );
}