import React, { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPin, Play, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateActionSheet from '../grow/CreateActionSheet';
import GrowEntryModal from '../grow/GrowEntryModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TAB_ROOTS = {
  Feed: '/Feed',
  Map: '/Map',
  Reels: '/Reels',
  // Marketplace: '/Marketplace' // vorübergehend deaktiviert
};

export default function MobileBottomNav({ user, currentPageName, hidden }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showGrowEntry, setShowGrowEntry] = useState(false);
  const [activeDiaries, setActiveDiaries] = useState([]);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [latestEntry, setLatestEntry] = useState(null);
  const [showDiaryPicker, setShowDiaryPicker] = useState(false);

  // Only load diaries when action sheet is actually opened (lazy)
  const diariesLoadedRef = React.useRef(false);
  const loadDiariesIfNeeded = useCallback(async () => {
    if (diariesLoadedRef.current || !user?.email) return;
    diariesLoadedRef.current = true;
    try {
      const d = await base44.entities.GrowDiary.filter({ created_by: user.email, status: 'active' }, '-created_date', 20);
      setActiveDiaries(d || []);
    } catch { setActiveDiaries([]); }
  }, [user?.email]);

  const handleCreatePress = useCallback((e) => {
    e.preventDefault();
    loadDiariesIfNeeded();
    setShowActionSheet(true);
  }, [loadDiariesIfNeeded]);

  const handleSelectAction = useCallback(async (action) => {
    if (action === 'grow_update') {
      if (activeDiaries.length === 1) {
        setSelectedDiary(activeDiaries[0]);
        const entries = await base44.entities.GrowDiaryEntry.filter(
          { diary_id: activeDiaries[0].id }, '-day_number', 1
        ).catch(() => []);
        setLatestEntry(entries?.[0] || null);
        setShowGrowEntry(true);
      } else if (activeDiaries.length > 1) {
        setShowDiaryPicker(true);
      } else {
        navigate('/CreateGrowDiary');
      }
    }
  }, [activeDiaries, navigate]);

  const handlePickDiary = useCallback(async (diary) => {
    setShowDiaryPicker(false);
    setSelectedDiary(diary);
    const entries = await base44.entities.GrowDiaryEntry.filter(
      { diary_id: diary.id }, '-day_number', 1
    ).catch(() => []);
    setLatestEntry(entries?.[0] || null);
    setShowGrowEntry(true);
  }, []);

  const handleGrowEntrySubmit = useCallback(async (entryData) => {
    setShowGrowEntry(false);
    if (!selectedDiary) return;
    const t = toast.loading('Speichere...');
    try {
      const newEntry = await base44.entities.GrowDiaryEntry.create({
        ...entryData,
        diary_id: selectedDiary.id,
        entry_date: new Date().toISOString()
      });
      if (entryData.visibility === 'feed' && newEntry?.id) {
        const quickLabels = { watered: '💧', fertilized: '🧪', topped: '✂️', lst: '🔗', flower_start: '🌸', problem: '⚠️', harvest: '🏆' };
        const actionTags = (entryData.quick_actions || []).map((a) => quickLabels[a] || '').join(' ');
        const content = [
        `📔 ${selectedDiary.name} — Tag ${entryData.day_number} · ${entryData.growth_stage}`,
        actionTags,
        entryData.plant_observation || '',
        `#GrowDiary #${(selectedDiary.strain_name || 'Cannabis').replace(/\s/g, '')}`].
        filter(Boolean).join('\n');
        const post = await base44.entities.Post.create({
          content,
          media_urls: entryData.media_urls || [],
          post_type: 'grow_diary_update',
          grow_diary_id: selectedDiary.id,
          grow_entry_id: newEntry.id,
          category: 'grow_diary',
          tags: [selectedDiary.strain_name, entryData.growth_stage].filter(Boolean),
          status: 'published',
          reactions: { like: { count: 0, users: [] }, fire: { count: 0, users: [] }, laugh: { count: 0, users: [] }, mind_blown: { count: 0, users: [] }, helpful: { count: 0, users: [] }, celebrate: { count: 0, users: [] } }
        });
        if (post?.id) {
          await base44.entities.GrowDiaryEntry.update(newEntry.id, { shared_to_feed: true, feed_post_id: post.id });
        }
        toast.success('Gespeichert & im Feed geteilt!', { id: t });
      } else {
        toast.success('Eintrag gespeichert!', { id: t });
      }
    } catch {
      toast.error('Fehler beim Speichern', { id: t });
    }
  }, [selectedDiary]);

  const handleTabPress = useCallback((e, item) => {
    if (navigator.vibrate) navigator.vibrate(6);
    if (item.isAction) {
      item.onClick(e);
      return;
    }
    const isActive = currentPageName === item.name ||
    item.name === 'Profile' && currentPageName === 'Profile';
    if (isActive) {
      e.preventDefault();
      const rootPath = TAB_ROOTS[item.name];
      if (rootPath && location.pathname + location.search !== rootPath) {
        navigate(rootPath, { replace: true });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPageName, location, navigate]);

  const navItems = [
  { name: 'Feed', icon: Home, path: '/Feed', label: 'Feed' },
  { name: 'Map', icon: MapPin, path: '/Map', label: 'Karte' },
  { name: 'create', icon: Plus, onClick: handleCreatePress, label: '', isAction: true },
  { name: 'Reels', icon: Play, path: '/Reels', label: 'Reels' },
  { name: 'Profile', icon: User, path: `/Profile?id=${user?.id || ''}`, label: 'Profil' }];


  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${hidden ? 'translate-y-[calc(100%+20px)]' : 'translate-y-0'}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      
      <div className="gh-glass border-t border-white/[0.08] pb-safe">
        <div className="flex items-center justify-around h-[62px] px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name ||
            item.name === 'Profile' && currentPageName === 'Profile';

            if (item.isAction) {
              return (
                <motion.button
                  key={item.name}
                  onClick={(e) => handleTabPress(e, item)}
                  whileTap={{ scale: 0.88 }}
                  className="flex items-center justify-center w-14 h-14 -mt-5">

                  <div className="bg-gradient-to-br opacity-50 rounded-2xl w-14 h-14 from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/40 ring-2 ring-green-500/20 ring-offset-2 ring-offset-black">
                    <Icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                  </div>
                </motion.button>);

            }

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => handleTabPress(e, item)}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-1">

                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-0.5">

                  {item.name === 'Reels' ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-white' : 'bg-white/[0.08] border border-white/[0.12]'}`
                    }>
                      <Play className={`w-3.5 h-3.5 ml-0.5 ${isActive ? 'text-black fill-black' : 'text-[var(--gh-text-muted)] fill-[var(--gh-text-muted)]'}`} />
                    </div>
                  ) : (
                    <Icon
                      className={`w-[21px] h-[21px] transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-[var(--gh-text-muted)]'}`
                      }
                      strokeWidth={isActive ? 2.2 : 1.6} />
                  )}
                  <span className={`text-[10px] leading-none transition-colors ${
                  isActive ? 'text-white' : 'text-[var(--gh-text-muted)]'
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>);

          })}
        </div>
      </div>

      {/* Action Sheet */}
      <CreateActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        hasActiveGrows={activeDiaries.length > 0}
        onSelectAction={handleSelectAction} />


      {/* Diary Picker */}
      {showDiaryPicker &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-end justify-center"
        onClick={() => setShowDiaryPicker(false)}>

          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-[var(--gh-surface)] rounded-t-[var(--gh-radius-2xl)] border-t border-white/[0.06] pb-safe"
          onClick={(e) => e.stopPropagation()}>

            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/[0.12] rounded-full" />
            </div>
            <div className="px-5 pb-2">
              <h3 className="text-lg font-bold text-white">Welcher Grow?</h3>
            </div>
            <div className="px-4 pb-6 space-y-1">
              {activeDiaries.map((d) =>
            <button
              key={d.id}
              onClick={() => handlePickDiary(d)}
              className="w-full flex items-center gap-3 p-4 rounded-[var(--gh-radius-lg)] hover:bg-white/[0.04] transition-colors">

                  <span className="text-xl">{
                d.current_stage === 'Blüte' ? '🌸' : d.current_stage === 'Wachstum' ? '🌳' : d.current_stage === 'Keimung' ? '🌱' : '🌿'
                }</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white text-sm">{d.name}</p>
                    <p className="text-xs text-[var(--gh-text-muted)]">{d.strain_name} · {d.current_stage}</p>
                  </div>
                </button>
            )}
            </div>
          </motion.div>
        </motion.div>
      }

      {/* Grow Entry Modal */}
      {showGrowEntry && selectedDiary &&
      <GrowEntryModal
        isOpen={true}
        diary={selectedDiary}
        latestEntry={latestEntry}
        onClose={() => {setShowGrowEntry(false);setSelectedDiary(null);}}
        onSubmit={handleGrowEntrySubmit} />

      }
    </nav>);

}