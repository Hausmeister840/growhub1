import { useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function SpatialComputingOverlay({ post }) {
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const supports3D = post.supports_spatial || post.media_urls?.some(url => url.includes('3d'));

  if (!supports3D) return null;

  const activate3DMode = () => {
    setIsSpatialMode(true);
    toast.success('3D Spatial Mode aktiviert! 🥽');
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={activate3DMode}
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 transition-all group"
    >
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      >
        <Box className="w-4 h-4 text-indigo-400" />
      </motion.div>
      <span className="text-xs text-indigo-400 font-medium">
        In 3D ansehen
      </span>
      <Maximize2 className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}