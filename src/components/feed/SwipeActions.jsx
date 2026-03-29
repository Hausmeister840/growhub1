import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Bookmark } from 'lucide-react';

export default function SwipeActions({ onLike, onBookmark, children, isBookmarked }) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const scale = useTransform(x, [-100, 0, 100], [1, 1, 1]);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const threshold = 100;

    if (info.offset.x > threshold) {
      onLike?.();
    } else if (info.offset.x < -threshold) {
      onBookmark?.();
    }

    x.set(0);
  };

  return (
    <div className="relative">
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-0"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      >
        <div className="bg-red-500 rounded-full p-4">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-0"
        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
      >
        <div className="bg-green-500 rounded-full p-4">
          <Bookmark className={`w-8 h-8 text-white ${isBookmarked ? 'fill-white' : ''}`} />
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x, opacity: scale }}
        className={`relative z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </motion.div>
    </div>
  );
}