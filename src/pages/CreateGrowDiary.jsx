import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, ChevronRight, Check, Sprout } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGES } from '../components/grow/GrowStageConfig';
import { DEFAULT_PLANS, createDefaultTasks } from '../components/grow/GrowPlanConfig';

const SETUP_TYPES = [
  { value: 'indoor', emoji: '🏠', label: 'Indoor', desc: 'Growbox / Zelt' },
  { value: 'outdoor', emoji: '☀️', label: 'Outdoor', desc: 'Freiland' },
  { value: 'greenhouse', emoji: '🏡', label: 'Gewächshaus', desc: 'Semi-Indoor' },
];

const GROW_METHODS = [
  { value: 'soil', emoji: '🌱', label: 'Erde' },
  { value: 'hydro', emoji: '💧', label: 'Hydro' },
  { value: 'coco', emoji: '🥥', label: 'Coco' },
  { value: 'aero', emoji: '💨', label: 'Aero' },
];

export default function CreateGrowDiary() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    strain_name: '',
    start_date: new Date().toISOString().split('T')[0],
    setup_type: 'indoor',
    grow_method: 'soil',
    plant_count: 1,
    current_stage: 'Keimung',
    cover_image_url: '',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('cover_image_url', file_url);
    } catch {
      toast.error('Upload fehlgeschlagen');
    }
    setIsUploading(false);
  };

  const canNext = form.name.trim().length > 0 && form.strain_name.trim().length > 0;

  const handleSubmit = async () => {
    if (!canNext) { toast.error('Name und Sorte erforderlich'); return; }
    setIsLoading(true);
    try {
      const defaultPlan = DEFAULT_PLANS[form.current_stage] || DEFAULT_PLANS.Keimung;
      const defaultTasks = createDefaultTasks(form.current_stage, form.grow_method);
      const diary = await base44.entities.GrowDiary.create({
        ...form,
        plant_count: Math.max(1, form.plant_count),
        status: 'active',
        stats: { total_days: 0, total_entries: 0, total_photos: 0 },
        share_settings: { is_public: false, allow_comments: true, auto_post_updates: false },
        grow_plan: {
          ...defaultPlan,
          generated_at: new Date().toISOString(),
          tasks: defaultTasks,
        },
        notifications_enabled: true,
      });
      toast.success('Grow-Tagebuch erstellt! 🌱');
      navigate(`/GrowDiaryDetail?id=${diary.id}`);
    } catch (err) {
      toast.error('Fehler: ' + (err?.message || 'Unbekannt'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/GrowDiaries')} className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Neuer Grow</h1>
              <p className="text-xs text-zinc-500">Schritt {step} von 3</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-6 bg-green-500' : s < step ? 'w-4 bg-green-500/50' : 'w-4 bg-zinc-700'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Basics */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sprout className="w-7 h-7 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Was growst du?</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Grow-Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="z.B. White Widow Indoor 2026" autoFocus
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Sorte / Strain</label>
                <input type="text" value={form.strain_name} onChange={e => set('strain_name', e.target.value)} placeholder="z.B. White Widow"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Startdatum</label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-green-500" />
              </div>
              <button onClick={() => setStep(2)} disabled={!canNext}
                className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${canNext ? 'bg-green-500 text-black active:scale-[0.98]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                Weiter <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Setup */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Dein Setup</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2.5 uppercase tracking-wide">Anbau-Art</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {SETUP_TYPES.map(o => (
                    <button key={o.value} onClick={() => set('setup_type', o.value)}
                      className={`p-3.5 rounded-xl border-2 text-center transition-all ${form.setup_type === o.value ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                      <span className="text-2xl block mb-1">{o.emoji}</span>
                      <p className="font-semibold text-white text-sm">{o.label}</p>
                      <p className="text-[10px] text-zinc-500">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2.5 uppercase tracking-wide">Methode</label>
                <div className="grid grid-cols-4 gap-2">
                  {GROW_METHODS.map(o => (
                    <button key={o.value} onClick={() => set('grow_method', o.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${form.grow_method === o.value ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                      <span className="text-lg">{o.emoji}</span>
                      <p className="text-xs text-white font-medium mt-1">{o.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2.5 uppercase tracking-wide">Pflanzen</label>
                <div className="flex items-center gap-4 bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                  <button onClick={() => set('plant_count', Math.max(1, form.plant_count - 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white font-bold text-xl flex items-center justify-center hover:bg-zinc-700">−</button>
                  <span className="text-2xl font-bold text-white flex-1 text-center">{form.plant_count}</span>
                  <button onClick={() => set('plant_count', Math.min(50, form.plant_count + 1))} className="w-10 h-10 rounded-xl bg-zinc-800 text-white font-bold text-xl flex items-center justify-center hover:bg-zinc-700">+</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2.5 uppercase tracking-wide">Phase</label>
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => set('current_stage', s.id)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${form.current_stage === s.id ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                      <span className="text-lg">{s.emoji}</span>
                      <p className="text-[11px] text-white font-medium mt-0.5">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(3)} className="w-full py-3.5 rounded-2xl font-bold text-base bg-green-500 text-black flex items-center justify-center gap-2 active:scale-[0.98]">
                Weiter <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Cover & Summary */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Fast fertig!</h2>
                <p className="text-sm text-zinc-500 mt-1">Optional: Cover-Bild</p>
              </div>

              {/* Upload */}
              <div className="relative h-48 bg-zinc-900 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-green-500/50 transition-colors group">
                {form.cover_image_url ? (
                  <>
                    <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium">Ändern</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                    <p className="text-sm text-zinc-500">Cover-Bild (optional)</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-2.5">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Zusammenfassung</h3>
                {[
                  ['Name', form.name],
                  ['Sorte', form.strain_name],
                  ['Setup', `${SETUP_TYPES.find(s => s.value === form.setup_type)?.emoji} ${SETUP_TYPES.find(s => s.value === form.setup_type)?.label}`],
                  ['Methode', `${GROW_METHODS.find(m => m.value === form.grow_method)?.emoji} ${GROW_METHODS.find(m => m.value === form.grow_method)?.label}`],
                  ['Pflanzen', form.plant_count],
                  ['Phase', `${STAGES.find(s => s.id === form.current_stage)?.emoji} ${form.current_stage}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-white">{val}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleSubmit} disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-green-500 to-emerald-500 text-black flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-green-500/20 disabled:opacity-50">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Erstelle...</> : <><Check className="w-5 h-5" /> Grow starten 🌱</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}