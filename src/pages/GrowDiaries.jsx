import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sprout, Leaf, Camera, ChevronRight, Zap, Sparkles, ArrowUpRight, HeartPulse, Flame } from 'lucide-react';
import { toast } from 'sonner';
import DiaryCard from '../components/grow/DiaryCard';
import ActiveGrowHero from '../components/grow/ActiveGrowHero';
import CreateActionSheet from '../components/grow/CreateActionSheet';
import GrowEntryModal from '../components/grow/GrowEntryModal';

const FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'active', label: 'Aktiv' },
  { id: 'attention', label: 'Achtung' },
  { id: 'completed', label: 'Fertig' },
];

function toMidnight(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function GrowDiaries() {
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showGrowEntry, setShowGrowEntry] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [latestEntry, setLatestEntry] = useState(null);
  const [showDiaryPicker, setShowDiaryPicker] = useState(false);
  const [diaryInsights, setDiaryInsights] = useState({});
  const navigate = useNavigate();

  const loadDiaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { setDiaries([]); return; }
      const data = await base44.entities.GrowDiary.filter({ created_by: user.email }, '-created_date', 100);
      setDiaries(data || []);
    } catch {
      setDiaries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDiaries(); }, [loadDiaries]);

  const activeDiaries = diaries.filter(d => d.status !== 'completed');

  useEffect(() => {
    let cancelled = false;
    const hydrateInsights = async () => {
      if (!diaries.length) {
        setDiaryInsights({});
        return;
      }

      const pairs = await Promise.all(diaries.map(async (diary) => {
        const tasks = diary.grow_plan?.tasks || [];
        const now = Date.now();
        const overdueTasks = tasks.filter(t => t.next_due && new Date(t.next_due).getTime() < now);
        const nextTask = tasks
          .filter(t => t.next_due && new Date(t.next_due).getTime() >= now)
          .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())[0];

        const entries = await base44.entities.GrowDiaryEntry
          .filter({ diary_id: diary.id }, '-entry_date', 1)
          .catch(() => []);

        const lastEntry = entries?.[0] || null;
        const lastEntryDate = toMidnight(lastEntry?.entry_date || lastEntry?.created_date);
        const daysSinceEntry = lastEntryDate ? Math.floor((Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const healthScore = diary.ai_insights?.health_score ?? 70;
        const urgency = overdueTasks.length > 0 || (daysSinceEntry != null && daysSinceEntry > 2) || healthScore < 55
          ? 'high'
          : overdueTasks.length > 0 || (daysSinceEntry != null && daysSinceEntry > 1) || healthScore < 70
            ? 'medium'
            : 'low';

        return [diary.id, {
          overdueTasks: overdueTasks.length,
          nextTaskLabel: nextTask?.title || nextTask?.task || null,
          nextTaskDue: nextTask?.next_due || null,
          daysSinceEntry,
          lastEntryDay: lastEntry?.day_number || null,
          urgency,
        }];
      }));

      if (!cancelled) setDiaryInsights(Object.fromEntries(pairs));
    };

    hydrateInsights();
    return () => { cancelled = true; };
  }, [diaries]);

  const handleCreate = async () => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) { toast.error('Bitte melde dich an'); base44.auth.redirectToLogin(); return; }
    setShowActionSheet(true);
  };

  const handleSelectAction = useCallback(async (actionId) => {
    setShowActionSheet(false);
    if (actionId === 'grow_update') {
      if (activeDiaries.length === 1) {
        setSelectedDiary(activeDiaries[0]);
        const entries = await base44.entities.GrowDiaryEntry.filter({ diary_id: activeDiaries[0].id }, '-day_number', 1).catch(() => []);
        setLatestEntry(entries?.[0] || null);
        setShowGrowEntry(true);
      } else if (activeDiaries.length > 1) {
        setShowDiaryPicker(true);
      } else {
        navigate('/CreateGrowDiary');
      }
    }
  }, [activeDiaries, navigate]);

  const openGrowEntryForDiary = useCallback(async (diary) => {
    setSelectedDiary(diary);
    const entries = await base44.entities.GrowDiaryEntry.filter({ diary_id: diary.id }, '-day_number', 1).catch(() => []);
    setLatestEntry(entries?.[0] || null);
    setShowGrowEntry(true);
  }, []);

  const handlePickDiary = useCallback(async (diary) => {
    setShowDiaryPicker(false);
    openGrowEntryForDiary(diary);
  }, [openGrowEntryForDiary]);

  const handleGrowEntrySubmit = useCallback(async (entryData) => {
    setShowGrowEntry(false);
    if (!selectedDiary) return;
    const t = toast.loading('Speichere...');
    try {
      const newEntry = await base44.entities.GrowDiaryEntry.create({
        ...entryData,
        diary_id: selectedDiary.id,
        entry_date: new Date().toISOString(),
      });
      if (entryData.visibility === 'feed' && newEntry?.id) {
        const quickLabels = { watered: '💧', fertilized: '🧪', topped: '✂️', lst: '🔗', flower_start: '🌸', problem: '⚠️', harvest: '🏆' };
        const actionTags = (entryData.quick_actions || []).map(a => quickLabels[a] || '').join(' ');
        const content = [`📔 ${selectedDiary.name} — Tag ${entryData.day_number} · ${entryData.growth_stage}`, actionTags, entryData.plant_observation || '', `#GrowDiary #${(selectedDiary.strain_name || 'Cannabis').replace(/\s/g, '')}`].filter(Boolean).join('\n');
        const post = await base44.entities.Post.create({
          content, media_urls: entryData.media_urls || [], post_type: 'grow_diary_update',
          grow_diary_id: selectedDiary.id, grow_entry_id: newEntry.id, category: 'grow_diary',
          tags: [selectedDiary.strain_name, entryData.growth_stage].filter(Boolean), status: 'published',
          reactions: { like: { count: 0, users: [] }, fire: { count: 0, users: [] }, laugh: { count: 0, users: [] }, mind_blown: { count: 0, users: [] }, helpful: { count: 0, users: [] }, celebrate: { count: 0, users: [] } },
        });
        if (post?.id) await base44.entities.GrowDiaryEntry.update(newEntry.id, { shared_to_feed: true, feed_post_id: post.id });
        toast.success('Gespeichert & im Feed geteilt!', { id: t });
      } else {
        toast.success('Eintrag gespeichert!', { id: t });
      }
      loadDiaries();
    } catch {
      toast.error('Fehler beim Speichern', { id: t });
    }
  }, [selectedDiary, loadDiaries]);

  const filtered = diaries.filter((d) => {
    const insight = diaryInsights[d.id];
    const matchSearch = !searchQuery.trim() || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.strain_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const needsAttention = insight?.urgency === 'high';
    const matchFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && d.status !== 'completed') ||
      (activeFilter === 'attention' && d.status !== 'completed' && needsAttention) ||
      (activeFilter === 'completed' && d.status === 'completed');
    return matchSearch && matchFilter;
  });

  const activeCount = diaries.filter(d => d.status !== 'completed').length;
  const completedCount = diaries.filter(d => d.status === 'completed').length;
  const avgHealth = diaries.filter(d => d.ai_insights?.health_score).reduce((sum, d, _, arr) => sum + d.ai_insights.health_score / arr.length, 0);
  const attentionCount = activeDiaries.filter(d => diaryInsights[d.id]?.urgency === 'high').length;

  const focusRecommendation = useMemo(() => {
    const sorted = [...activeDiaries].sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return (rank[diaryInsights[a.id]?.urgency || 'low'] - rank[diaryInsights[b.id]?.urgency || 'low']);
    });
    const focusDiary = sorted[0];
    if (!focusDiary) return null;
    const insight = diaryInsights[focusDiary.id];
    if (insight?.overdueTasks > 0) {
      return {
        diary: focusDiary,
        title: `${insight.overdueTasks} Aufgabe(n) überfällig`,
        subtitle: insight.nextTaskLabel ? `Nächste: ${insight.nextTaskLabel}` : 'Prüfe heute deinen Plan',
        cta: 'Aufgaben öffnen',
      };
    }
    if (insight?.daysSinceEntry != null && insight.daysSinceEntry > 1) {
      return {
        diary: focusDiary,
        title: `Seit ${insight.daysSinceEntry} Tagen kein Update`,
        subtitle: 'Jetzt einen neuen Eintrag mit Foto erstellen',
        cta: 'Schnell-Update',
      };
    }
    return {
      diary: focusDiary,
      title: 'Alles stabil im Plan',
      subtitle: 'Nutze den KI-Scan für ein frisches Gesundheits-Update',
      cta: 'KI-Scan starten',
    };
  }, [activeDiaries, diaryInsights]);

  return (
    <div className="min-h-screen pb-32 bg-[#070a09] bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.14),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.10),transparent_40%)]">
      <div className="sticky top-[52px] lg:top-0 z-20 border-b border-emerald-300/10 bg-[#070a09]/85 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/12 via-zinc-900/80 to-cyan-500/10 p-4 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 text-[10px] uppercase tracking-wider font-semibold text-emerald-200 mb-2">
                  <Leaf className="w-3 h-3" />
                  Growtagebuch
                </div>
                <h1 className="text-xl font-black text-white leading-tight">
                  Deine Pflanzen. <span className="text-emerald-300">Klarer Fokus.</span>
                </h1>
                {!isLoading && diaries.length > 0 && (
                  <p className="text-xs text-zinc-300 mt-2">
                    {activeCount} aktiv · {completedCount} abgeschlossen · {attentionCount} brauchen Aufmerksamkeit
                  </p>
                )}
              </div>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
              >
                <Plus className="w-4 h-4" />
                Neu
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Nach Sorte, Tagebuch oder Phase suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 pl-9 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-400/40"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {!isLoading && diaries.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-300" />
                Aktive Grows
              </p>
              <p className="text-2xl font-black text-emerald-300">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-cyan-300" />
                Durchschnitt Health
              </p>
              <p className={`text-2xl font-black ${avgHealth >= 75 ? 'text-emerald-300' : avgHealth >= 50 ? 'text-yellow-300' : 'text-zinc-300'}`}>
                {avgHealth > 0 ? Math.round(avgHealth) : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-300" />
                Kritisch
              </p>
              <p className={`text-2xl font-black ${attentionCount > 0 ? 'text-orange-300' : 'text-zinc-300'}`}>{attentionCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-1">Gesamt</p>
              <p className="text-2xl font-black text-white">{diaries.length}</p>
            </div>
          </div>
        )}

        {!isLoading && diaries.length > 0 && focusRecommendation && (
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              if (focusRecommendation.cta.includes('Scan')) {
                navigate(`/PlantScan?diary=${focusRecommendation.diary.id}`);
              } else if (focusRecommendation.cta.includes('Aufgaben')) {
                navigate(`/GrowDiaryDetail?id=${focusRecommendation.diary.id}&tab=plan`);
              } else {
                openGrowEntryForDiary(focusRecommendation.diary);
              }
            }}
            className="w-full rounded-3xl border border-cyan-300/25 bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-teal-500/10 p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-400/15 border border-cyan-300/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-cyan-200/85 mb-1">Heute Priorität</p>
                <p className="text-white font-bold text-sm">{focusRecommendation.diary.name}</p>
                <p className="text-xs text-zinc-300 mt-0.5">{focusRecommendation.title}</p>
                <p className="text-xs text-zinc-400 mt-1">{focusRecommendation.subtitle}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-200 mt-1" />
            </div>
          </motion.button>
        )}

        {!isLoading && diaries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleCreate}
              className="rounded-2xl p-3.5 border border-emerald-300/20 bg-emerald-500/10 text-left hover:bg-emerald-500/15 transition-colors"
            >
              <p className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-300" />
                Eintrag erfassen
              </p>
              <p className="text-xs text-emerald-200/70 mt-1">Foto, Messwerte und Notizen in unter 30 Sekunden</p>
            </button>
            <button
              onClick={() => navigate('/PlantScan')}
              className="rounded-2xl p-3.5 border border-cyan-300/20 bg-cyan-500/10 text-left hover:bg-cyan-500/15 transition-colors"
            >
              <p className="text-sm font-bold text-cyan-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-300" />
                KI-Scan starten
              </p>
              <p className="text-xs text-cyan-100/70 mt-1">Gesundheitscheck direkt am Tagebuch verknüpfen</p>
            </button>
          </div>
        )}

        {!isLoading && diaries.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === f.id
                    ? 'bg-emerald-400 text-black'
                    : 'bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-zinc-900/80 rounded-2xl border border-white/10 overflow-hidden">
                <div className="h-44 bg-zinc-800/70 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-zinc-700 rounded-lg animate-pulse w-3/4" />
                  <div className="h-2.5 bg-zinc-700/70 rounded-lg animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && diaries.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-6 rounded-3xl border border-white/10 bg-zinc-900/60">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-400/20">
              <Sprout className="w-12 h-12 text-emerald-300/60" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Starte dein erstes Growtagebuch</h3>
            <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">Halte jeden Tag fest, was mit deiner Pflanze passiert - mit Fotos, Messwerten und KI-Feedback.</p>
            <button onClick={handleCreate} className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-2xl text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
              <Zap className="w-4 h-4" /> Grow starten
            </button>
          </motion.div>
        )}

        {/* No Search Results */}
        {!isLoading && diaries.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 rounded-2xl border border-white/10 bg-zinc-900/60">
            <p className="text-zinc-400 text-sm">Keine Ergebnisse für "{searchQuery}"</p>
          </div>
        )}

        {/* Active Grow Hero */}
        {!isLoading && activeFilter !== 'completed' && activeDiaries.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Aktueller Grow</p>
            <ActiveGrowHero diary={activeDiaries[0]} />
            {/* Quick Scan CTA */}
            <button
              onClick={() => navigate(`/PlantScan?diary=${activeDiaries[0].id}`)}
              className="w-full flex items-center gap-3 p-3.5 bg-cyan-500/[0.08] border border-cyan-400/[0.18] rounded-2xl hover:bg-cyan-500/[0.12] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Camera className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-bold text-white">KI-Pflanzenscan</p>
                <p className="text-[10px] text-zinc-400">Gesundheit analysieren · sofort verknüpft</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        )}

        {/* Diary Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {activeFilter !== 'completed' && activeDiaries.length > 0 && filtered.filter(d => d.id !== activeDiaries[0]?.id).length > 0 && (
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Weitere Grows</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {filtered
                .filter(d => activeFilter === 'completed' || d.id !== activeDiaries[0]?.id)
                .map((diary, idx) => (
                  <DiaryCard key={diary.id} diary={diary} index={idx} onClick={() => navigate(`/GrowDiaryDetail?id=${diary.id}`)} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {!isLoading && diaries.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCreate}
          className="hidden lg:flex fixed bottom-6 right-6 z-30 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-2xl shadow-2xl shadow-green-500/30 items-center justify-center"
        >
          <Plus className="w-7 h-7 text-black" />
        </motion.button>
      )}

      {/* Action Sheet */}
      <CreateActionSheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)} hasActiveGrows={activeDiaries.length > 0} onSelectAction={handleSelectAction} />

      {/* Diary Picker */}
      {showDiaryPicker && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowDiaryPicker(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-full bg-zinc-950 rounded-t-3xl border-t border-zinc-800 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-zinc-800 rounded-full" /></div>
            <div className="px-5 pb-3"><h3 className="text-lg font-bold text-white">Für welchen Grow?</h3></div>
            <div className="px-4 pb-8 space-y-1">
              {activeDiaries.map(d => (
                <button key={d.id} onClick={() => handlePickDiary(d)} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-zinc-800/60 transition-colors">
                  <span className="text-xl">{d.current_stage === 'Blüte' ? '🌸' : d.current_stage === 'Wachstum' ? '🌳' : d.current_stage === 'Keimung' ? '🌱' : '🌿'}</span>
                  <div className="text-left flex-1">
                    <p className="font-bold text-white text-sm">{d.name}</p>
                    <p className="text-xs text-zinc-500">{d.strain_name} · {d.current_stage}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Grow Entry Modal */}
      {showGrowEntry && selectedDiary && (
        <GrowEntryModal isOpen={true} diary={selectedDiary} latestEntry={latestEntry} onClose={() => { setShowGrowEntry(false); setSelectedDiary(null); }} onSubmit={handleGrowEntrySubmit} />
      )}
    </div>
  );
}