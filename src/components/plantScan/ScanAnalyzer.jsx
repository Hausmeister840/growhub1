import { useEffect, useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Brain, Scan, Leaf, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createNotification } from '@/components/utils/createNotification';

const STEPS = [
  { id: 'upload', icon: Scan, label: 'Bild wird hochgeladen', progress: 15 },
  { id: 'analyze', icon: Brain, label: 'KI-Analyse läuft…', progress: 50 },
  { id: 'evaluate', icon: Leaf, label: 'Ergebnisse auswerten', progress: 80 },
  { id: 'save', icon: ShieldCheck, label: 'Diagnose speichern', progress: 95 },
];

// Timeout wrapper — rejects after ms
function withTimeout(promise, ms, label = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: Zeitüberschreitung (${Math.round(ms/1000)}s)`)), ms)),
  ]);
}

function buildPrompt(envData, previousScans, scanMode, plantName) {
  const envEntries = Object.entries(envData || {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  const envParams = envEntries.map(([k, v]) => `  ${k}: ${v}`).join('\n');

  const modeInstructions = {
    health: 'Führe eine VOLLSTÄNDIGE Gesundheitsanalyse durch. Bewerte alle visuellen Aspekte: Blattfarbe, Textur, Turgor, Internodienabstand, Stammstärke, Wurzelzone (falls sichtbar).',
    pest: 'FOKUS SCHÄDLINGE & KRANKHEITEN: Suche akribisch nach Spinnmilben, Blattläusen, Thrips, Trauermücken, Mehltau, Botrytis, Fusarium, Wurzelfäule. Beschreibe visuelle Symptome exakt.',
    nutrient: 'FOKUS NÄHRSTOFFDIAGNOSE: Analysiere Chlorosen, Nekrosen, Verfärbungen. Bestimme welche Nährstoffe fehlen oder im Überschuss sind (N, P, K, Ca, Mg, Fe, Mn, Zn). Berücksichtige pH-Einfluss.',
    identify: 'FOKUS IDENTIFIKATION: Bestimme Pflanzenart, Sorte, Typ (Indica/Sativa/Ruderalis/Hybrid), Wachstumsphase. Analysiere Blattmorphologie, Blütenstruktur, Trichommuster.',
  };

  let history = '';
  if (previousScans?.length > 0) {
    const recent = previousScans.slice(0, 5);
    history = '\nSCAN-VERLAUF DES NUTZERS:\n' + recent.map((s, i) => {
      const risks = s.risk_factors?.length || 0;
      return `Scan ${i + 1} (${new Date(s.created_date).toLocaleDateString('de')}): Score ${s.health_score || '?'}/100, ${risks} Risiken${s.environment_data?.current_stage ? `, Phase: ${s.environment_data.current_stage}` : ''}`;
    }).join('\n');
    const scores = recent.map(s => s.health_score).filter(Boolean);
    if (scores.length > 1) {
      const trend = scores[0] - scores[scores.length - 1];
      history += `\nTrend: ${trend > 5 ? '⬆️ VERBESSERUNG' : trend < -5 ? '⬇️ VERSCHLECHTERUNG' : '➡️ STABIL'} (${trend > 0 ? '+' : ''}${trend} Punkte)`;
    }
    history += '\n';
  }

  const plantContext = plantName ? `PFLANZENNAME: ${plantName}\n` : '';

  return `Du bist ein Experte für Pflanzendiagnostik und Cannabis-Anbau mit 20 Jahren Erfahrung.

AUFGABE: ${modeInstructions[scanMode] || modeInstructions.health}

${plantContext}${envEntries.length > 0 ? `UMGEBUNGSPARAMETER:\n${envParams}\n` : ''}${history}
ANWEISUNGEN:
- Analysiere das Bild PRÄZISE und DETAILLIERT
- Gesundheitsscore: 0-100 (0=tot, 50=mittelmäßig, 75=gut, 90+=exzellent)
- Berücksichtige Umgebungsparameter bei der Bewertung
- Sei EHRLICH und SPEZIFISCH – beschreibe nur was wirklich sichtbar ist
- Gib KONKRETE, UMSETZBARE Empfehlungen mit genauen Werten (z.B. "pH auf 6.2 anpassen", nicht "pH anpassen")
- Für Cannabis: Berücksichtige Sortenspezifika, Trainingsstand, Trichomreife
- Wenn etwas nicht klar erkennbar ist, sage das explizit`;
}

const SCHEMA = {
  type: 'object',
  properties: {
    plant_name: { type: 'string' },
    is_cannabis: { type: 'boolean' },
    strain_type: { type: 'string' },        // Indica / Sativa / Hybrid / Autoflower
    health_score: { type: 'number' },
    overall_assessment: { type: 'string' }, // 2-3 Sätze Gesamtbewertung
    quick_summary: { type: 'string' },      // 1 Satz kurze Zusammenfassung
    growth_stage: { type: 'string' },
    // Visual markers
    leaf_health: { type: 'string' },
    stem_health: { type: 'string' },
    pest_indicators: { type: 'string' },
    nutrient_status: { type: 'string' },
    trichome_stage: { type: 'string' },
    light_stress: { type: 'string' },
    turgor_pressure: { type: 'string' },
    root_zone: { type: 'string' },
    // Risks — parallel arrays for reliability
    risk_factors: { type: 'array', items: { type: 'string' } },
    risk_severities: { type: 'array', items: { type: 'string' } }, // critical/high/medium/low
    risk_descriptions: { type: 'array', items: { type: 'string' } },
    // Actions — parallel arrays
    action_items: { type: 'array', items: { type: 'string' } },
    action_priorities: { type: 'array', items: { type: 'string' } }, // urgent/high/medium/low
    action_descriptions: { type: 'array', items: { type: 'string' } },
    action_timings: { type: 'array', items: { type: 'string' } },    // z.B. "Sofort", "Innerhalb 24h"
    // Environment
    environment_feedback: { type: 'string' },
    ph_recommendation: { type: 'string' },   // z.B. "pH auf 6.2 anpassen"
    vpd_assessment: { type: 'string' },
    // Prognose
    estimated_yield_grams: { type: 'number' },
    days_to_harvest: { type: 'number' },
    harvest_window: { type: 'string' },
    risk_level: { type: 'string' },          // low/medium/high/critical
    // Positive findings
    positive_observations: { type: 'array', items: { type: 'string' } },
    // Score breakdown
    leaf_score: { type: 'number' },
    root_score: { type: 'number' },
    pest_score: { type: 'number' },
    nutrient_score: { type: 'number' },
  }
};

export default function ScanAnalyzer({ image, imagePreview, envData, scanMode, linkedDiary, previousScans, plantName, onComplete, onError }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const hasStarted = useRef(false);

  const doAnalysis = useCallback(async () => {
    if (!image) {
      onError();
      return;
    }

    try {
      // Step 0: Upload (15s timeout)
      setCurrentStep(0);
      console.log('[ScanAnalyzer] Uploading...');
      const { file_url } = await withTimeout(
        base44.integrations.Core.UploadFile({ file: image }),
        15000, 'Upload'
      );
      console.log('[ScanAnalyzer] Upload done:', file_url);

      // Step 1: AI Analysis (60s timeout)
      setCurrentStep(1);
      console.log('[ScanAnalyzer] LLM call...');
      const prompt = buildPrompt(envData, previousScans, scanMode, plantName);
      
      const raw = await withTimeout(
        base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [file_url],
          response_json_schema: SCHEMA,
          model: 'gemini_3_flash',
        }),
        60000, 'KI-Analyse'
      );
      console.log('[ScanAnalyzer] LLM done, type:', typeof raw);

      // Step 2: Evaluate — transform flat result into rich format
      setCurrentStep(2);
      
      const result = (typeof raw === 'string') ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : (raw || {});
      
      let finalScore = typeof result.health_score === 'number' ? Math.round(result.health_score) : 75;
      if (result.risk_severities?.some(s => ['critical', 'kritisch'].includes(s))) finalScore = Math.min(finalScore, 40);
      if (result.risk_severities?.some(s => ['high', 'hoch'].includes(s))) finalScore = Math.min(finalScore, 65);
      finalScore = Math.max(0, Math.min(100, finalScore));

      const enriched = {
        plant_identification: {
          common_name: plantName || result.plant_name || 'Unbekannt',
          is_cannabis: result.is_cannabis || false,
          strain_type: result.strain_type || '',
        },
        health_score: finalScore,
        quick_summary: result.quick_summary || '',
        overall_assessment: result.overall_assessment || '',
        growth_stage: result.growth_stage || '',
        score_breakdown: {
          leaf: result.leaf_score ?? null,
          root: result.root_score ?? null,
          pest: result.pest_score ?? null,
          nutrient: result.nutrient_score ?? null,
        },
        visual_markers: {
          leaf_color_health: result.leaf_health || '',
          stem_health: result.stem_health || '',
          pest_indicators: result.pest_indicators || '',
          nutrient_markers: result.nutrient_status || '',
          trichome_stage: result.trichome_stage || '',
          light_stress: result.light_stress || '',
          turgor_pressure: result.turgor_pressure || '',
          root_zone: result.root_zone || '',
        },
        risk_factors: (result.risk_factors || []).map((title, i) => ({
          title: typeof title === 'string' ? title : (title?.title || 'Risiko'),
          severity: result.risk_severities?.[i] || 'medium',
          description: result.risk_descriptions?.[i] || (typeof title === 'string' ? title : ''),
        })),
        action_plan: (result.action_items || []).map((title, i) => ({
          title: typeof title === 'string' ? title : (title?.title || 'Aktion'),
          priority: result.action_priorities?.[i] || 'medium',
          description: result.action_descriptions?.[i] || (typeof title === 'string' ? '' : title?.description || ''),
          timing: result.action_timings?.[i] || '',
        })),
        positive_observations: result.positive_observations || [],
        environment_feedback: {
          summary: result.environment_feedback || '',
          ph_recommendation: result.ph_recommendation || '',
          vpd_assessment: result.vpd_assessment || '',
        },
        predicted_outcomes: {
          estimated_yield_grams: result.estimated_yield_grams || 0,
          days_to_harvest: result.days_to_harvest || 0,
          harvest_window: result.harvest_window || '',
          risk_level: result.risk_level || 'medium',
        },
      };

      // Step 3: Save to DB (10s timeout)
      setCurrentStep(3);
      console.log('[ScanAnalyzer] Saving...');
      await withTimeout(
        base44.entities.PlantScan.create({
          image_url: file_url,
          health_score: finalScore,
          analysis_result: enriched,
          environment_data: envData || {},
          visual_markers: enriched.visual_markers,
          risk_factors: enriched.risk_factors,
          action_plan: enriched.action_plan,
          predicted_outcomes: enriched.predicted_outcomes,
          grow_diary_id: linkedDiary?.id || null,
        }),
        10000, 'Speichern'
      );

      // Update linked diary (fire and forget)
      if (linkedDiary?.id) {
        base44.entities.GrowDiary.update(linkedDiary.id, {
          ai_insights: {
            health_score: finalScore,
            last_analysis: new Date().toISOString(),
            last_analysis_summary: result.overall_assessment || '',
            current_issues: enriched.risk_factors.map(r => r.title),
            recommendations: enriched.action_plan.map(a => a.title),
          }
        }).catch(() => {});
      }

      // Send notification to current user
      try {
        const user = await base44.auth.me();
        if (user?.email) {
          const isCritical = finalScore < 50;
          await createNotification({
            recipientEmail: user.email,
            senderEmail: user.email,
            senderId: user.id,
            type: isCritical ? 'ai_warning' : 'ai_scan',
            message: isCritical
              ? `⚠️ Kritische Probleme erkannt! Pflanzenscore: ${finalScore}/100${enriched.risk_factors?.length > 0 ? ' — ' + enriched.risk_factors[0].title : ''}`
              : `🌿 PlantScan abgeschlossen: Gesundheitsscore ${finalScore}/100${linkedDiary ? ' für ' + linkedDiary.name : ''}`,
            ...(linkedDiary?.id ? { diaryId: linkedDiary.id } : {}),
          });
          window.dispatchEvent(new Event('refreshNotifications'));
        }
      } catch {}

      console.log('[ScanAnalyzer] Complete!');
      toast.success('Analyse abgeschlossen!');
      onComplete(enriched);
    } catch (err) {
      console.error('[ScanAnalyzer] Error:', err);
      setError(err.message || 'Unbekannter Fehler');
      toast.error('Analyse fehlgeschlagen');
    }
  }, [image, envData, scanMode, linkedDiary, previousScans, onComplete, onError]);

  // Run analysis once on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    doAnalysis();
  }, [doAnalysis]);

  // Error state with retry
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white font-bold text-lg mb-2">Analyse fehlgeschlagen</p>
        <p className="text-zinc-500 text-sm text-center mb-6 max-w-xs">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              hasStarted.current = false;
              setCurrentStep(0);
              // Trigger re-run via state change
              setTimeout(() => doAnalysis(), 100);
            }}
            className="px-6 py-3 bg-green-500 text-black font-bold rounded-2xl text-sm"
          >
            Erneut versuchen
          </button>
          <button
            onClick={onError}
            className="px-6 py-3 bg-white/[0.06] text-zinc-300 font-medium rounded-2xl text-sm border border-white/[0.08]"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    );
  }

  const step = STEPS[currentStep] || STEPS[0];
  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-6 relative"
    >
      {imagePreview && (
        <div className="absolute inset-0 z-0">
          <img src={imagePreview} alt="" className="w-full h-full object-cover opacity-10 blur-xl" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated rings */}
        <div className="relative w-36 h-36 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-[3px] border-green-500/20 border-t-green-500"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border-[3px] border-cyan-500/20 border-b-cyan-500"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-6 rounded-full border-[2px] border-emerald-500/20 border-l-emerald-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <StepIcon className="w-9 h-9 text-green-400" />
            </motion.div>
          </div>
        </div>

        <motion.p
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-black text-lg mb-1 text-center"
        >
          {step.label}
        </motion.p>
        <p className="text-zinc-500 text-sm mb-1">Plant Intelligence™</p>
        <p className="text-zinc-600 text-xs mb-6">KI-gestützte Pflanzendiagnostik</p>

        {/* Progress bar */}
        <div className="w-52 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${step.progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-500 via-cyan-500 to-emerald-500 rounded-full"
          />
        </div>

        {/* Step dots */}
        <div className="flex gap-2 mt-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              animate={i === currentStep ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.6, repeat: i === currentStep ? Infinity : 0 }}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentStep ? 'bg-green-500' : i === currentStep ? 'bg-cyan-400' : 'bg-white/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}