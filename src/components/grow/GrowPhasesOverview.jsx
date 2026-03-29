import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Thermometer, Droplets, Sun, CheckCircle2, AlertCircle } from 'lucide-react';

const PHASES = [
  {
    id: 'Keimung',
    emoji: '🌱',
    color: 'from-yellow-500 to-yellow-600',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    duration: '3–10 Tage',
    description: 'Der Samen keimt und der erste Wurzelansatz entwickelt sich.',
    requirements: {
      temp: '22–28°C',
      humidity: '70–90%',
      light: '18h / Dunkel oder gedämpft',
      ph: '5.8–6.2',
      ec: '0.4–0.8',
    },
    characteristics: [
      'Samen öffnet sich und Keimwurzel tritt aus',
      'Erste Keimblätter (Kotyledonen) erscheinen',
      'Empfindlich gegen Überfeuchte',
      'Noch keine Nährstoffgabe nötig',
    ],
    tips: [
      'Samen vorkeimen im feuchten Papiertuch',
      'Erste Gabe nur mit reinem Wasser (pH 5.8)',
      'Hohe Luftfeuchtigkeit schützt vor Austrocknung',
    ],
    warnings: ['Staunässe vermeiden — Wurzeln brauchen Sauerstoff'],
  },
  {
    id: 'Sämling',
    emoji: '🌿',
    color: 'from-lime-500 to-lime-600',
    border: 'border-lime-500/30',
    bg: 'bg-lime-500/10',
    textColor: 'text-lime-400',
    duration: '1–3 Wochen',
    description: 'Die Pflanze entwickelt ihre ersten echten Blätter und beginnt zu wachsen.',
    requirements: {
      temp: '20–25°C',
      humidity: '60–70%',
      light: '18h / 200–400 PPFD',
      ph: '5.8–6.3',
      ec: '0.4–1.0',
    },
    characteristics: [
      'Erste gezackte Blätter erscheinen',
      'Wurzelsystem baut sich auf',
      'Schwacher Nährstoffbedarf',
      'Sehr empfindlich gegenüber Stress',
    ],
    tips: [
      'Vorsichtige Nährstoffgabe starten (¼ Dosis)',
      'Kleiner Topf für bessere Wurzelkontrolle',
      'Sanfte Belüftung stärkt den Stängel',
    ],
    warnings: ['Kein Nährstoffstress — Überdüngung sofort sichtbar'],
  },
  {
    id: 'Wachstum',
    emoji: '🌳',
    color: 'from-green-500 to-green-600',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    textColor: 'text-green-400',
    duration: '3–8 Wochen',
    description: 'Schnelles vegetatives Wachstum, Pflanze verdoppelt ihre Größe mehrfach.',
    requirements: {
      temp: '20–28°C',
      humidity: '40–60%',
      light: '18h / 400–600 PPFD',
      ph: '5.8–6.5',
      ec: '1.0–1.8',
    },
    characteristics: [
      'Explosives Höhenwachstum',
      'Viele Seitentriebe entwickeln sich',
      'Hoher Stickstoffbedarf (N)',
      'Ideale Zeit für Training (Topping, LST)',
    ],
    tips: [
      'Topping bei 4–5. Nodeum für buschiges Wachstum',
      'LST für gleichmäßige Lichtverteilung',
      'Umtopfen wenn Wurzeln sichtbar werden',
      'EC langsam auf 1.6–1.8 steigern',
    ],
    warnings: ['Übermäßiger Stickstoff verlangsamt Blüteeinleitung'],
  },
  {
    id: 'Blüte',
    emoji: '🌸',
    color: 'from-purple-500 to-purple-600',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    duration: '7–11 Wochen',
    description: 'Blütenbildung und Trichom-Entwicklung. Die wichtigste Phase.',
    requirements: {
      temp: '18–26°C',
      humidity: '40–50%',
      light: '12h / 600–900 PPFD',
      ph: '5.8–6.5',
      ec: '1.2–2.0',
    },
    characteristics: [
      'Photoperiode auf 12/12 umstellen (Photoperiode)',
      'Blüten formen sich und schwellen an',
      'Höchster Nährstoffbedarf (P, K)',
      'Trichome entwickeln sich',
    ],
    tips: [
      'Blütestimulator in früher Blüte einsetzen',
      'Temperatur unter 26°C für Terpene',
      'Defoliation in Woche 3 & 6 für besseren Lichteinfall',
      'Trichom-Farbe kontrollieren für Erntezeitpunkt',
    ],
    warnings: ['Luftfeuchtigkeit über 50% fördert Schimmel!', 'Kein Licht in der Dunkelphase (12h)'],
  },
  {
    id: 'Spülung',
    emoji: '💧',
    color: 'from-blue-500 to-blue-600',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    duration: '1–2 Wochen',
    description: 'Nährstoffe werden ausgespült für reineren Geschmack.',
    requirements: {
      temp: '18–24°C',
      humidity: '40–50%',
      light: '12h / wie Blüte',
      ph: '5.8–6.2',
      ec: '< 0.4',
    },
    characteristics: [
      'Nur noch reines Wasser mit korrektem pH',
      'Blätter beginnen zu vergilben (normal)',
      'Trichome reifen vollständig',
      'Letzte Tage vor der Ernte',
    ],
    tips: [
      'Runoff-EC unter 0.4 anstreben',
      'Trichome täglich unter Lupe prüfen',
      'Milchige + bernsteinfarbene Trichome = Erntezeit',
    ],
    warnings: ['Zu kurze Spülung = harter, chemischer Geschmack'],
  },
  {
    id: 'Ernte',
    emoji: '🏆',
    color: 'from-orange-500 to-orange-600',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    duration: '1–3 Tage',
    description: 'Ernte, Trocknung und Verarbeitung der reifen Blüten.',
    requirements: {
      temp: '15–21°C',
      humidity: '45–55%',
      light: 'Dunkel oder gedimmt',
      ph: '—',
      ec: '—',
    },
    characteristics: [
      '70–90% der Haare braun/rot',
      'Mehrheit der Trichome bernsteinfarben',
      'Blüten riechen intensiv',
      'Direkter Schnitt nahe der Wurzel',
    ],
    tips: [
      'Morgens ernten für höchste Terpene',
      'Trocknung bei 15–21°C, 45–55% rH, 8–14 Tage',
      'Langsame Trocknung = besserer Geschmack',
    ],
    warnings: ['Nicht zu früh ernten — letzte Tage entscheiden über Potenz!'],
  },
];

function PhaseCard({ phase, isActive, isExpanded, onToggle }) {
  return (
    <motion.div
      className={`rounded-2xl border overflow-hidden transition-all ${
        isActive
          ? `${phase.border} ${phase.bg}`
          : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
        onClick={onToggle}
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center text-xl flex-shrink-0`}>
          {phase.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${isActive ? phase.textColor : 'text-white'}`}>
              {phase.id}
            </p>
            {isActive && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${phase.bg} ${phase.textColor} border ${phase.border}`}>
                Aktiv
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{phase.duration}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">{phase.description}</p>

              {/* Requirements */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Thermometer, label: 'Temperatur', value: phase.requirements.temp, color: 'text-orange-400' },
                  { icon: Droplets, label: 'Luftfeuchte', value: phase.requirements.humidity, color: 'text-blue-400' },
                  { icon: Sun, label: 'Licht', value: phase.requirements.light, color: 'text-yellow-400' },
                  { icon: null, label: 'pH', value: phase.requirements.ph, color: 'text-purple-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-zinc-800/60 rounded-xl p-2.5">
                    <div className="flex items-center gap-1 mb-1">
                      {Icon ? <Icon className={`w-3 h-3 ${color}`} /> : <span className={`text-xs font-bold ${color}`}>⚗</span>}
                      <p className="text-[10px] text-zinc-500">{label}</p>
                    </div>
                    <p className="text-xs font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {/* Characteristics */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Merkmale</p>
                <div className="space-y-1.5">
                  {phase.characteristics.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${phase.textColor}`} />
                      <p className="text-xs text-zinc-300">{c}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Tipps</p>
                <div className="space-y-1.5">
                  {phase.tips.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs flex-shrink-0">💡</span>
                      <p className="text-xs text-zinc-300">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {phase.warnings?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1.5">
                  {phase.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GrowPhasesOverview({ currentStage }) {
  const [expandedPhase, setExpandedPhase] = useState(currentStage);

  return (
    <div className="space-y-2">
      {PHASES.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          isActive={phase.id === currentStage}
          isExpanded={expandedPhase === phase.id}
          onToggle={() => setExpandedPhase(prev => prev === phase.id ? null : phase.id)}
        />
      ))}
    </div>
  );
}