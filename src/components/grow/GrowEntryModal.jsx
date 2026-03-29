import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import {
  X, Camera, Loader2, Thermometer, Droplets, Droplet,
  Activity, TrendingUp, AlertCircle, Brain, Sparkles,
  Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import QuickActionChips from './QuickActionChips';
import VisibilitySelector from './VisibilitySelector';

const GROWTH_STAGES = [
  { id: 'Keimung', emoji: '🌱' },
  { id: 'Sämling', emoji: '🌿' },
  { id: 'Wachstum', emoji: '🌳' },
  { id: 'Blüte', emoji: '🌸' },
  { id: 'Spülung', emoji: '💧' },
  { id: 'Ernte', emoji: '🏆' },
];

const HEALTH_LABELS = {
  excellent: '🟢 Ausgezeichnet',
  good: '🟡 Gut',
  fair: '🟠 Mäßig',
  poor: '🔴 Schlecht',
  critical: '🚨 Kritisch'
};

const HEALTH_COLORS = {
  excellent: 'text-green-400',
  good: 'text-lime-400',
  fair: 'text-yellow-400',
  poor: 'text-orange-400',
  critical: 'text-red-400'
};

export default function GrowEntryModal({ isOpen, onClose, onSubmit, diary, latestEntry, editingEntry }) {
  const [formData, setFormData] = useState({
    growth_stage: diary?.current_stage || 'Wachstum',
    day_number: (latestEntry?.day_number || 0) + 1,
    week_number: Math.floor(((latestEntry?.day_number || 0) + 1) / 7) + 1,
    plant_observation: '',
    plant_height_cm: null,
    environment_data: { temp_c: null, humidity_rh: null },
    feeding_data: { water_ml: null, ph: null },
    media_urls: [],
    quick_actions: [],
    visibility: 'private',
  });

  const [uploadingPhotos, setUploadingPhotos] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        growth_stage: editingEntry.growth_stage || diary?.current_stage || 'Wachstum',
        day_number: editingEntry.day_number,
        week_number: editingEntry.week_number,
        plant_observation: editingEntry.plant_observation || '',
        plant_height_cm: editingEntry.plant_height_cm || null,
        environment_data: editingEntry.environment_data || { temp_c: null, humidity_rh: null },
        feeding_data: editingEntry.feeding_data || { water_ml: null, ph: null },
        media_urls: editingEntry.media_urls || [],
        quick_actions: editingEntry.quick_actions || editingEntry.actions_taken || [],
        visibility: editingEntry.visibility || 'private',
      });
      if (editingEntry.ai_analysis) setAiAnalysis(editingEntry.ai_analysis);
    }
  }, [editingEntry, diary]);

  const analyzePhotos = useCallback(async (urls) => {
    const photos = urls || formData.media_urls;
    if (!photos || photos.length === 0) return;

    setIsAnalyzing(true);
    const t = toast.loading('🤖 KI analysiert deine Pflanze...');

    try {
      const temp = formData.environment_data?.temp_c;
      const humidity = formData.environment_data?.humidity_rh;
      const ph = formData.feeding_data?.ph;

      const measurementsText = [
        temp ? `Temperatur: ${temp}°C` : null,
        humidity ? `Luftfeuchtigkeit: ${humidity}%` : null,
        ph ? `pH-Wert: ${ph}` : null,
      ].filter(Boolean).join(', ') || 'Keine Messwerte';

      const prompt = `Du bist ein erfahrener Cannabis-Grower. Analysiere dieses Pflanzenfoto.

PFLANZENDATEN:
- Sorte: ${diary?.strain_name || 'Unbekannt'}
- Phase: ${formData.growth_stage} (Tag ${formData.day_number})
- Setup: ${diary?.setup_type || 'Indoor'}
- Messwerte: ${measurementsText}

Gib eine kurze, konkrete Einschätzung auf Deutsch.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [photos[0]],
        response_json_schema: {
          type: 'object',
          properties: {
            health_assessment: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor', 'critical'] },
            confidence_score: { type: 'number' },
            detected_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue_type: { type: 'string' },
                  severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  description: { type: 'string' },
                  recommendation: { type: 'string' }
                }
              }
            },
            positive_observations: { type: 'array', items: { type: 'string' } },
            next_24h_actions: { type: 'array', items: { type: 'string' } },
            detailed_analysis: { type: 'string' }
          }
        }
      });

      if (analysis) {
        setAiAnalysis(analysis);
        toast.success(`✅ ${HEALTH_LABELS[analysis.health_assessment] || 'Analyse fertig'}`, { id: t, duration: 3000 });
      }
    } catch {
      toast.error('KI-Analyse fehlgeschlagen', { id: t });
    } finally {
      setIsAnalyzing(false);
    }
  }, [formData, diary]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const maxFiles = 10 - formData.media_urls.length;
    const filesToUpload = files.slice(0, maxFiles);
    setUploadingPhotos(filesToUpload.map(f => ({ name: f.name, done: false })));
    const uploaded = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: filesToUpload[i] });
        uploaded.push(file_url);
        setUploadingPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, done: true } : p));
      } catch {
        toast.error(`Fehler bei ${filesToUpload[i].name}`);
      }
    }

    const newUrls = [...formData.media_urls, ...uploaded];
    setFormData(prev => ({ ...prev, media_urls: newUrls }));
    setTimeout(() => setUploadingPhotos([]), 800);
    e.target.value = '';

    if (formData.media_urls.length === 0 && uploaded.length > 0 && !aiAnalysis) {
      analyzePhotos(newUrls);
    }
  };

  const removePhoto = (index) => {
    const newUrls = formData.media_urls.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, media_urls: newUrls }));
    if (index === 0 || newUrls.length === 0) setAiAnalysis(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.plant_observation.trim() && formData.media_urls.length === 0 && formData.quick_actions.length === 0) {
      toast.error('Bitte Beobachtung, Foto oder Aktion hinzufügen');
      return;
    }
    onSubmit({
      ...formData,
      actions_taken: formData.quick_actions,
      entry_date: new Date().toISOString(),
      ...(aiAnalysis ? { ai_analysis: aiAnalysis } : {}),
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto border border-zinc-800"
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editingEntry ? 'Eintrag bearbeiten' : `Tag ${formData.day_number}`}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{diary?.name} · {diary?.strain_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* 1. PHOTO UPLOAD - Most prominent */}
          <div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {formData.media_urls.map((url, index) => (
                <div key={index} className="relative aspect-square group">
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}

              {uploadingPhotos.filter(u => !u.done).map((_, i) => (
                <div key={`up-${i}`} className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                </div>
              ))}

              {formData.media_urls.length + uploadingPhotos.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-zinc-800 rounded-xl flex flex-col items-center justify-center hover:bg-zinc-700 transition-colors border-2 border-dashed border-zinc-700 hover:border-green-500/50"
                >
                  <Camera className="w-7 h-7 text-zinc-500 mb-1" />
                  <span className="text-xs text-zinc-600">Foto</span>
                </button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

            {formData.media_urls.length > 0 && !isAnalyzing && (
              <button
                type="button"
                onClick={() => { setAiAnalysis(null); analyzePhotos(); }}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-xl font-medium text-sm transition-all ${
                  aiAnalysis
                    ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                    : 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-300'
                }`}
              >
                <Brain className="w-4 h-4" />
                {aiAnalysis ? '🔄 Neu analysieren' : 'Mit KI analysieren'}
              </button>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 py-3 text-purple-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                KI analysiert... ca. 10 Sekunden
              </div>
            )}
          </div>

          {/* AI Analysis Result */}
          <AnimatePresence>
            {aiAnalysis && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  aiAnalysis.health_assessment === 'excellent' ? 'bg-green-500/10 border-green-500/30' :
                  aiAnalysis.health_assessment === 'good' ? 'bg-lime-500/10 border-lime-500/30' :
                  aiAnalysis.health_assessment === 'fair' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">KI-Analyse</span>
                  </div>
                  <span className={`text-sm font-bold ${HEALTH_COLORS[aiAnalysis.health_assessment] || 'text-white'}`}>
                    {HEALTH_LABELS[aiAnalysis.health_assessment]}
                  </span>
                </div>

                {aiAnalysis.detected_issues?.length > 0 && (
                  <div className="p-3 bg-zinc-800/80 border border-zinc-700 rounded-xl space-y-2">
                    {aiAnalysis.detected_issues.slice(0, 2).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-orange-300">{issue.issue_type}</span>
                          {issue.recommendation && <p className="text-zinc-400 mt-0.5">→ {issue.recommendation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {aiAnalysis.positive_observations?.length > 0 && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1">
                    {aiAnalysis.positive_observations.slice(0, 3).map((obs, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-green-300">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{obs}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. QUICK ACTIONS */}
          <QuickActionChips
            selected={formData.quick_actions}
            onChange={(actions) => setFormData(prev => ({ ...prev, quick_actions: actions }))}
          />

          {/* 3. TEXT */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Was ist heute passiert?</label>
            <Textarea
              value={formData.plant_observation}
              onChange={e => setFormData(prev => ({ ...prev, plant_observation: e.target.value }))}
              placeholder="Kurze Beobachtung, Notiz oder einfach leer lassen..."
              className="min-h-[80px] bg-zinc-800 border-zinc-700 rounded-xl resize-none text-sm"
            />
          </div>

          {/* 4. PHASE (compact) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Phase</label>
            <div className="flex gap-1.5 flex-wrap">
              {GROWTH_STAGES.map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, growth_stage: stage.id }))}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.growth_stage === stage.id
                      ? 'bg-green-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span>{stage.emoji}</span>
                  <span>{stage.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. ADVANCED METRICS (collapsed by default) */}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <span className="font-medium">📊 Messwerte & Umgebung</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Höhe (cm)</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number" step="0.1"
                      value={formData.plant_height_cm || ''}
                      onChange={e => setFormData(prev => ({ ...prev, plant_height_cm: parseFloat(e.target.value) || null }))}
                      placeholder="z.B. 35.5"
                      className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Temperatur (°C)</label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number" step="0.1"
                        value={formData.environment_data.temp_c || ''}
                        onChange={e => setFormData(prev => ({ ...prev, environment_data: { ...prev.environment_data, temp_c: parseFloat(e.target.value) || null } }))}
                        placeholder="24"
                        className="w-full pl-9 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Luftfeuchtigkeit (%)</label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number" step="1"
                        value={formData.environment_data.humidity_rh || ''}
                        onChange={e => setFormData(prev => ({ ...prev, environment_data: { ...prev.environment_data, humidity_rh: parseInt(e.target.value) || null } }))}
                        placeholder="60"
                        className="w-full pl-9 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Wasser (ml)</label>
                    <div className="relative">
                      <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number" step="10"
                        value={formData.feeding_data.water_ml || ''}
                        onChange={e => setFormData(prev => ({ ...prev, feeding_data: { ...prev.feeding_data, water_ml: parseInt(e.target.value) || null } }))}
                        placeholder="500"
                        className="w-full pl-9 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">pH-Wert</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number" step="0.1"
                        value={formData.feeding_data.ph || ''}
                        onChange={e => setFormData(prev => ({ ...prev, feeding_data: { ...prev.feeding_data, ph: parseFloat(e.target.value) || null } }))}
                        placeholder="6.5"
                        className="w-full pl-9 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6. VISIBILITY - The key feature */}
          <VisibilitySelector
            value={formData.visibility}
            onChange={(v) => setFormData(prev => ({ ...prev, visibility: v }))}
          />

          {/* 7. SUBMIT */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 font-medium text-sm hover:bg-zinc-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                formData.visibility === 'feed'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20'
                  : 'bg-green-500 hover:bg-green-400 text-black'
              }`}
            >
              {editingEntry
                ? '✓ Speichern'
                : formData.visibility === 'feed'
                  ? '📤 Speichern & teilen'
                  : '+ Eintrag speichern'
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}