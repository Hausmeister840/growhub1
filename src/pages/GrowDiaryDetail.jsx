import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createNotification } from '@/components/utils/createNotification';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Brain, Loader2, Share2, Camera,
  Sprout, AlertCircle, MoreHorizontal, Scan
} from 'lucide-react';
import { toast } from 'sonner';

import DiaryHeader from '../components/grow/DiaryHeader';
import DiaryTimeline from '../components/grow/DiaryTimeline';
import GrowEntryModal from '../components/grow/GrowEntryModal';
import ShareGrowDiaryModal from '../components/grow/ShareGrowDiaryModal';
import GrowCharts from '../components/grow/GrowCharts';
import PlantTrackingDashboard from '../components/grow/PlantTrackingDashboard';
import GrowPhasesOverview from '../components/grow/GrowPhasesOverview';
import GrowPlanDashboard from '../components/grow/GrowPlanDashboard';
import SmartGrowAssistant from '../components/grow/SmartGrowAssistant';
import WeeklyOverview from '../components/grow/WeeklyOverview';

const TABS = [
  { id: 'plan',     label: 'Anbauplan',  emoji: '📅' },
  { id: 'timeline', label: 'Timeline',   emoji: '📋' },
  { id: 'weekly',   label: 'Woche',      emoji: '📆' },
  { id: 'tracking', label: 'Tracking',   emoji: '📊' },
  { id: 'ai',       label: 'KI',         emoji: '🤖' },
  { id: 'phases',   label: 'Phasen',     emoji: '🌱' },
];

export default function GrowDiaryDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const diaryId = new URLSearchParams(location.search).get('id');

  const [diary, setDiary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('plan');

  const loadData = useCallback(async () => {
    if (!diaryId) return;
    setIsLoading(true);
    try {
      const [user, diaryData, entriesData] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.GrowDiary.filter({ id: diaryId }),
        base44.entities.GrowDiaryEntry.filter({ diary_id: diaryId }, '-day_number'),
      ]);
      setCurrentUser(user);
      if (diaryData?.[0]) setDiary(diaryData[0]);
      setEntries(entriesData || []);
    } catch {
      toast.error('Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  }, [diaryId]);

  useEffect(() => { loadData(); }, [loadData]);

  const isOwner = currentUser && (diary?.created_by === currentUser.email || diary?.created_by === currentUser.id);

  const shareEntryToFeed = useCallback(async (entryId, entryData) => {
    if (!currentUser || !diary) return;
    try {
      const quickLabels = { watered: '💧', fertilized: '🧪', topped: '✂️', lst: '🔗', flower_start: '🌸', problem: '⚠️', harvest: '🏆' };
      const actionTags = (entryData.quick_actions || []).map(a => quickLabels[a] || '').join(' ');
      const content = [
        `📔 ${diary.name} — Tag ${entryData.day_number} · ${entryData.growth_stage}`,
        actionTags,
        entryData.plant_observation || '',
        `#GrowDiary #${(diary.strain_name || 'Cannabis').replace(/\s/g, '')}`,
      ].filter(Boolean).join('\n');
      const post = await base44.entities.Post.create({
        content, media_urls: entryData.media_urls || [], post_type: 'grow_diary_update',
        grow_diary_id: diaryId, grow_entry_id: entryId, category: 'grow_diary',
        tags: [diary.strain_name, entryData.growth_stage].filter(Boolean), status: 'published',
        reactions: { like: { count: 0, users: [] }, fire: { count: 0, users: [] }, laugh: { count: 0, users: [] }, mind_blown: { count: 0, users: [] }, helpful: { count: 0, users: [] }, celebrate: { count: 0, users: [] } },
      });
      if (post?.id) await base44.entities.GrowDiaryEntry.update(entryId, { shared_to_feed: true, feed_post_id: post.id });
    } catch (err) {
      console.error('Feed share failed:', err);
    }
  }, [currentUser, diary, diaryId]);

  const handleNewEntry = useCallback(async (entryData) => {
    setShowEntryModal(false);
    const t = toast.loading(editingEntry ? 'Aktualisiere...' : 'Speichere...');
    try {
      if (editingEntry) {
        await base44.entities.GrowDiaryEntry.update(editingEntry.id, entryData);
        if (entryData.visibility === 'feed' && !editingEntry.shared_to_feed) {
          await shareEntryToFeed(editingEntry.id, entryData);
        }
        toast.success('Aktualisiert!', { id: t });
      } else {
        const newEntry = await base44.entities.GrowDiaryEntry.create({
          ...entryData, diary_id: diaryId, entry_date: new Date().toISOString(),
        });
        if (entryData.visibility === 'feed' && newEntry?.id) {
          await shareEntryToFeed(newEntry.id, entryData);
        }
        toast.success(entryData.visibility === 'feed' ? 'Gespeichert & geteilt!' : 'Eintrag gespeichert!', { id: t });
        if (currentUser?.email) {
          const hasAI = !!entryData.ai_analysis;
          createNotification({
            recipientEmail: currentUser.email, senderEmail: currentUser.email, senderId: currentUser.id,
            type: hasAI ? 'ai_scan' : 'diary_entry',
            message: hasAI
              ? `🤖 KI-Analyse Tag ${entryData.day_number} in "${diary?.name}"`
              : `📔 Neuer Eintrag: Tag ${entryData.day_number} in "${diary?.name}"`,
            diary_id: diaryId,
          }).then(() => window.dispatchEvent(new Event('refreshNotifications'))).catch(() => {});
        }
      }
      setEditingEntry(null);
      await loadData();
    } catch {
      toast.error('Fehler beim Speichern', { id: t });
    }
  }, [diaryId, loadData, editingEntry, shareEntryToFeed, currentUser, diary]);

  const handleDeleteEntry = useCallback(async (entryId) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    const t = toast.loading('Lösche...');
    try {
      await base44.entities.GrowDiaryEntry.delete(entryId);
      toast.success('Gelöscht!', { id: t });
      await loadData();
    } catch {
      toast.error('Fehler', { id: t });
    }
  }, [loadData]);

  const handleShareEntry = useCallback(async (entry) => {
    if (entry.shared_to_feed) { toast.info('Bereits geteilt'); return; }
    const t = toast.loading('Teile im Feed...');
    try {
      await shareEntryToFeed(entry.id, entry);
      toast.success('Geteilt!', { id: t });
      await loadData();
    } catch {
      toast.error('Fehler', { id: t });
    }
  }, [shareEntryToFeed, loadData]);

  const handleStageChange = useCallback(async (newStage) => {
    try {
      const { createDefaultTasks, DEFAULT_PLANS } = await import('../components/grow/GrowPlanConfig');
      const defaultPlan = DEFAULT_PLANS[newStage];
      const newTasks = createDefaultTasks(newStage, diary?.grow_method);
      const updatedPlan = { ...defaultPlan, generated_at: new Date().toISOString(), tasks: newTasks };
      await base44.entities.GrowDiary.update(diaryId, { current_stage: newStage, grow_plan: updatedPlan });
      setDiary(prev => ({ ...prev, current_stage: newStage, grow_plan: updatedPlan }));
      toast.success(`Phase: ${newStage}`);
      if (currentUser?.email) {
        const phaseEmojis = { Keimung: '🌱', Sämling: '🌿', Wachstum: '🌳', Blüte: '🌸', Spülung: '💧', Ernte: '🏆' };
        createNotification({
          recipientEmail: currentUser.email, senderEmail: currentUser.email, senderId: currentUser.id,
          type: 'diary_milestone',
          message: `${phaseEmojis[newStage] || '🌱'} Neue Phase: "${newStage}" in "${diary?.name}"`,
          diary_id: diaryId,
        }).then(() => window.dispatchEvent(new Event('refreshNotifications'))).catch(() => {});
      }
    } catch {
      toast.error('Fehler');
    }
  }, [diaryId, diary, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div>
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Nicht gefunden</h2>
          <button onClick={() => navigate('/GrowDiaries')} className="mt-4 px-6 py-3 bg-green-500 text-black font-bold rounded-2xl">Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/GrowDiaries')} className="p-2 -ml-2 hover:bg-zinc-800/60 rounded-xl transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{diary.name}</h1>
            <p className="text-[10px] text-zinc-500 truncate">{diary.strain_name} · {diary.current_stage}</p>
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => navigate(`/PlantScan?diary=${diaryId}`)}
                className="p-2 hover:bg-cyan-500/15 rounded-xl transition-colors"
                title="KI-Scan"
              >
                <Scan className="w-5 h-5 text-cyan-400" />
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`p-2 hover:bg-purple-500/15 rounded-xl transition-colors ${activeTab === 'ai' ? 'bg-purple-500/15' : ''}`}
                title="KI-Assistent"
              >
                <Brain className="w-5 h-5 text-purple-400" />
              </button>
              <button
                onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}
                className="p-2 hover:bg-green-500/15 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5 text-green-400" />
              </button>
              <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-zinc-800/60 rounded-xl transition-colors">
                <MoreHorizontal className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-green-500 text-black' : 'bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:text-white'
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Sheet */}
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 bg-zinc-950 rounded-t-3xl p-6 border-t border-zinc-800/80" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
              <div className="space-y-1">
                <button onClick={() => { setShowMenu(false); navigate(`/PlantScan?diary=${diaryId}`); }} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-zinc-800/60 transition-colors text-left">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">Pflanze scannen</p>
                    <p className="text-zinc-500 text-xs">KI-Diagnose · direkt verknüpft</p>
                  </div>
                </button>
                <button onClick={() => { setShowMenu(false); setShowShareModal(true); }} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-zinc-800/60 transition-colors text-left">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">Tagebuch teilen</p>
                    <p className="text-zinc-500 text-xs">Community & Social</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Diary Header */}
        <DiaryHeader diary={diary} entries={entries} onStageChange={handleStageChange} editable={isOwner} />

        {/* Empty state */}
        {entries.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-14 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
            <Sprout className="w-14 h-14 text-green-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Noch keine Einträge</h3>
            <p className="text-zinc-500 text-sm mb-6">Starte jetzt mit Tag 1!</p>
            {isOwner && (
              <button onClick={() => { setEditingEntry(null); setShowEntryModal(true); }} className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Ersten Eintrag erstellen
              </button>
            )}
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GrowPlanDashboard diary={diary} entries={entries} onUpdate={updatedDiary => setDiary(updatedDiary)} />
            </motion.div>
          )}
          {activeTab === 'timeline' && entries.length > 0 && (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryTimeline entries={entries} diary={diary} isOwner={isOwner} onEdit={entry => { setEditingEntry(entry); setShowEntryModal(true); }} onDelete={handleDeleteEntry} onShare={handleShareEntry} />
            </motion.div>
          )}
          {activeTab === 'weekly' && (
            <motion.div key="weekly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WeeklyOverview entries={entries} diary={diary} />
            </motion.div>
          )}
          {activeTab === 'tracking' && entries.length > 0 && (
            <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <GrowCharts entries={entries} />
              <PlantTrackingDashboard diary={diary} entries={entries} />
            </motion.div>
          )}
          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SmartGrowAssistant diary={diary} entries={entries} />
            </motion.div>
          )}
          {activeTab === 'phases' && (
            <motion.div key="phases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GrowPhasesOverview currentStage={diary.current_stage} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      {isOwner && entries.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center justify-center"
        >
          <Plus className="w-7 h-7 text-black" />
        </motion.button>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showEntryModal && (
          <GrowEntryModal
            isOpen={true} diary={diary} editingEntry={editingEntry} latestEntry={entries[0]}
            onClose={() => { setShowEntryModal(false); setEditingEntry(null); }}
            onSubmit={handleNewEntry}
          />
        )}
        {showShareModal && <ShareGrowDiaryModal diary={diary} onClose={() => setShowShareModal(false)} />}
      </AnimatePresence>
    </div>
  );
}