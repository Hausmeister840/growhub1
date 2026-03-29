import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SWIPE_THRESHOLD = 60;

function SwipeableScanItem({ scan, prevScan, onSelectScan, onDeleted, index }) {
  const x = useMotionValue(0);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Background color based on swipe direction
  const leftBg = useTransform(x, [-120, -SWIPE_THRESHOLD, 0], ['#ef4444', '#ef4444', 'transparent']);
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD, 120], ['transparent', '#22c55e', '#22c55e']);

  const leftOpacity = useTransform(x, [-120, -SWIPE_THRESHOLD, 0], [1, 0.8, 0]);
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD, 120], [0, 0.8, 1]);

  // Fallback logic for legacy scans without health_score
  let displayScore = scan.health_score;
  if (displayScore === undefined || displayScore === null) {
    const assessment = scan.analysis_result?.health_assessment || 'unknown';
    if (assessment === 'excellent') displayScore = 95;
    else if (assessment === 'good') displayScore = 80;
    else if (assessment === 'fair') displayScore = 60;
    else if (assessment === 'poor') displayScore = 40;
    else if (assessment === 'critical') displayScore = 20;
  }

  const scoreColor = (displayScore || 0) >= 75 ? 'text-green-400' : (displayScore || 0) >= 50 ? 'text-yellow-400' : 'text-red-400';

  const delta = (displayScore !== undefined && prevScan?.health_score !== undefined)
    ? displayScore - prevScan.health_score
    : null;

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;

    if (offset < -SWIPE_THRESHOLD) {
      // Swipe left → delete
      animate(x, -300, { duration: 0.2 });
      setIsDeleting(true);
      try {
        await base44.entities.PlantScan.delete(scan.id);
        toast.success('Scan gelöscht');
        setTimeout(() => onDeleted(scan.id), 200);
      } catch {
        toast.error('Fehler beim Löschen');
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
        setIsDeleting(false);
      }
    } else if (offset > SWIPE_THRESHOLD) {
      // Swipe right → view
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      onSelectScan(scan);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
    setIsDragging(false);
  };

  if (isDeleting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Background hints */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-5"
        style={{ backgroundColor: leftBg, opacity: leftOpacity }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center pl-5"
        style={{ backgroundColor: rightBg, opacity: rightOpacity }}
      >
        <Eye className="w-5 h-5 text-white" />
      </motion.div>

      {/* Card */}
      <motion.div
        ref={dragRef}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -200, right: 120 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => { if (!isDragging) onSelectScan(scan); }}
        className="relative w-full flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl cursor-grab active:cursor-grabbing select-none touch-pan-y"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.08]">
          <img src={scan.image_url} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-black ${scoreColor}`}>
              {displayScore !== undefined ? displayScore : '?'}
            </span>
            {delta !== null && delta !== 0 && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${
                delta > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate">
            {formatDistanceToNow(new Date(scan.created_date), { addSuffix: true, locale: de })}
            {scan.environment_data?.current_stage ? ` · ${scan.environment_data.current_stage}` : ''}
          </p>
        </div>

        {scan.risk_factors?.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold flex-shrink-0">
            {scan.risk_factors.length}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ScanHistoryTimeline({ scans = [], onSelectScan, onScansChanged }) {
  const [localScans, setLocalScans] = useState(scans);
  const deletedIdsRef = React.useRef(new Set());

  // Sync if parent updates scans, but exclude recently deleted ones
  React.useEffect(() => {
    const filtered = scans.filter(s => !deletedIdsRef.current.has(s.id));
    setLocalScans(filtered);
  }, [scans]);

  const handleDeleted = (id) => {
    deletedIdsRef.current.add(id);
    setLocalScans(prev => prev.filter(s => s.id !== id));
    if (onScansChanged) onScansChanged();
  };

  if (localScans.length === 0) return null;

  return (
    <div>
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-zinc-500" />
        Scan-Verlauf
        <span className="text-zinc-600 text-xs font-normal ml-1">← löschen · ansehen →</span>
      </h3>

      <div className="space-y-2">
        <AnimatePresence>
          {localScans.map((scan, i) => (
            <SwipeableScanItem
              key={scan.id}
              scan={scan}
              prevScan={localScans[i + 1]}
              onSelectScan={onSelectScan}
              onDeleted={handleDeleted}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}