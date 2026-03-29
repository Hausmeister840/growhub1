import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function ScoreCircle({ score, size = 'md' }) {
  const color = score >= 75 ? 'text-green-400 border-green-500/40' : score >= 50 ? 'text-yellow-400 border-yellow-500/40' : 'text-red-400 border-red-500/40';
  const s = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg';
  return (
    <div className={`${s} rounded-full border-2 ${color} flex items-center justify-center font-black`}>
      {score}
    </div>
  );
}

function DiffBadge({ diff }) {
  if (diff === 0) return <span className="flex items-center gap-0.5 text-xs font-bold text-zinc-500"><Minus className="w-3 h-3" />±0</span>;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-black ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {diff > 0 ? '+' : ''}{diff}
    </span>
  );
}

function MarkerRow({ label, a, b }) {
  if (!a && !b) return null;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 py-2 border-b border-white/[0.04] items-start">
      <p className="text-xs text-zinc-300 leading-relaxed">{a || <span className="text-zinc-600 italic">–</span>}</p>
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider whitespace-nowrap">{label}</span>
        <ArrowRight className="w-3 h-3 text-zinc-600" />
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed text-right">{b || <span className="text-zinc-600 italic">–</span>}</p>
    </div>
  );
}

export default function ScanComparison({ scans = [] }) {
  const sorted = [...scans].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const [idxA, setIdxA] = useState(1); // older
  const [idxB, setIdxB] = useState(0); // newer

  if (scans.length < 2) {
    return (
      <div className="text-center py-12 px-6">
        <p className="text-white font-bold mb-1">Mindestens 2 Scans nötig</p>
        <p className="text-zinc-500 text-sm">Führe noch einen Scan durch, um Vergleiche zu sehen.</p>
      </div>
    );
  }

  const scanA = sorted[idxA];
  const scanB = sorted[idxB];
  if (!scanA || !scanB) return null;

  const scoreA = scanA.health_score ?? 0;
  const scoreB = scanB.health_score ?? 0;
  const diff = scoreB - scoreA;

  const vmA = scanA.analysis_result?.visual_markers || {};
  const vmB = scanB.analysis_result?.visual_markers || {};
  const rfA = (scanA.risk_factors || scanA.analysis_result?.risk_factors || []).map(r => typeof r === 'string' ? r : r.title);
  const rfB = (scanB.risk_factors || scanB.analysis_result?.risk_factors || []).map(r => typeof r === 'string' ? r : r.title);

  // Issues resolved vs new
  const resolved = rfA.filter(r => !rfB.includes(r));
  const newIssues = rfB.filter(r => !rfA.includes(r));

  return (
    <div className="space-y-4">
      {/* Scan picker */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left (older) */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 text-center">Vorher</p>
          <select
            value={idxA}
            onChange={e => setIdxA(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-zinc-300 appearance-none text-center"
          >
            {sorted.map((s, i) => i !== idxB && (
              <option key={s.id} value={i}>
                {format(new Date(s.created_date), 'dd.MM HH:mm', { locale: de })} · {s.health_score ?? '?'}
              </option>
            ))}
          </select>
        </div>
        {/* Right (newer) */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 text-center">Nachher</p>
          <select
            value={idxB}
            onChange={e => setIdxB(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-2 text-xs text-zinc-300 appearance-none text-center"
          >
            {sorted.map((s, i) => i !== idxA && (
              <option key={s.id} value={i}>
                {format(new Date(s.created_date), 'dd.MM HH:mm', { locale: de })} · {s.health_score ?? '?'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Score comparison hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left scan */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/[0.08]">
              {scanA.image_url ? <img src={scanA.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800" />}
            </div>
            <ScoreCircle score={scoreA} />
            <p className="text-[10px] text-zinc-500 text-center">
              {format(new Date(scanA.created_date), 'dd. MMM', { locale: de })}
            </p>
          </div>

          {/* Center diff */}
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-6 h-6 text-zinc-600" />
            <DiffBadge diff={diff} />
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              diff > 5 ? 'bg-green-500/15 text-green-400' :
              diff < -5 ? 'bg-red-500/15 text-red-400' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {diff > 5 ? 'Verbessert' : diff < -5 ? 'Verschlechtert' : 'Stabil'}
            </div>
          </div>

          {/* Right scan */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/[0.08]">
              {scanB.image_url ? <img src={scanB.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800" />}
            </div>
            <ScoreCircle score={scoreB} />
            <p className="text-[10px] text-zinc-500 text-center">
              {format(new Date(scanB.created_date), 'dd. MMM', { locale: de })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resolved issues */}
      {resolved.length > 0 && (
        <div className="p-4 rounded-2xl bg-green-500/[0.06] border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-300">{resolved.length} Problem{resolved.length > 1 ? 'e' : ''} behoben</span>
          </div>
          <div className="space-y-1">
            {resolved.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New issues */}
      {newIssues.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-300">{newIssues.length} neue{newIssues.length > 1 ? 's' : ''} Problem{newIssues.length > 1 ? 'e' : ''}</span>
          </div>
          <div className="space-y-1">
            {newIssues.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual marker comparison */}
      {(vmA || vmB) && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Visueller Vergleich</p>
          <MarkerRow label="Blätter" a={vmA.leaf_color_health} b={vmB.leaf_color_health} />
          <MarkerRow label="Nährstoffe" a={vmA.nutrient_markers} b={vmB.nutrient_markers} />
          <MarkerRow label="Schädlinge" a={vmA.pest_indicators} b={vmB.pest_indicators} />
          <MarkerRow label="Trichome" a={vmA.trichome_stage} b={vmB.trichome_stage} />
          <MarkerRow label="Stamm" a={vmA.stem_health} b={vmB.stem_health} />
        </div>
      )}
    </div>
  );
}