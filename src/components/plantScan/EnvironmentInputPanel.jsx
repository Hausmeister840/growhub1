import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Thermometer, Droplets, FlaskConical, Wind, 
  ChevronDown, ChevronUp, Zap, Clock, Layers
} from 'lucide-react';

const LIGHT_TYPES = ['LED', 'HPS', 'CMH', 'CFL', 'Sonnenlicht', 'Andere'];
const GROW_MEDIA = ['Erde', 'Coco', 'Hydro', 'Aero', 'DWC', 'Perlite Mix'];
const STAGES = ['Keimung', 'Sämling', 'Vegetativ', 'Vorblüte', 'Blüte', 'Spätblüte', 'Spülung', 'Ernte'];
const AIRFLOW_OPTIONS = ['Kein', 'Leicht', 'Mittel', 'Stark', 'Abluft + Umluft'];

function InputField({ label, icon: Icon, value, onChange, type = 'number', placeholder, unit, options }) {
  if (options) {
    return (
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                value === opt
                  ? 'bg-green-500 text-black'
                  : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(type === 'number' ? (e.target.value ? parseFloat(e.target.value) : null) : e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm
            placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20
            transition-all"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{unit}</span>
        )}
      </div>
    </div>
  );
}

export default function EnvironmentInputPanel({ data, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (key, val) => {
    onChange({ ...data, [key]: val });
  };

  const filledCount = Object.values(data || {}).filter(v => v !== null && v !== undefined && v !== '').length;

  return (
    <div className="bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/[0.10] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-sm">Umgebungsdaten</h3>
            <p className="text-xs text-zinc-500">
              {filledCount === 0 ? 'Optional – verbessert Analyse erheblich' : `${filledCount} Parameter erfasst`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filledCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
              +{Math.min(filledCount * 8, 60)}% Genauigkeit
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              {/* Essential parameters */}
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Grundparameter</p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Temperatur"
                    icon={Thermometer}
                    value={data.temperature_c}
                    onChange={(v) => update('temperature_c', v)}
                    placeholder="24"
                    unit="°C"
                  />
                  <InputField
                    label="Luftfeuchtigkeit"
                    icon={Droplets}
                    value={data.humidity_percent}
                    onChange={(v) => update('humidity_percent', v)}
                    placeholder="55"
                    unit="%"
                  />
                  <InputField
                    label="pH Gießwasser"
                    icon={FlaskConical}
                    value={data.ph_water}
                    onChange={(v) => update('ph_water', v)}
                    placeholder="6.2"
                  />
                  <InputField
                    label="Grow-Tag"
                    icon={Clock}
                    value={data.grow_day}
                    onChange={(v) => update('grow_day', v)}
                    placeholder="35"
                    unit="Tag"
                  />
                </div>
              </div>

              {/* Grow stage & medium */}
              <div className="space-y-3">
                <InputField
                  label="Wachstumsphase"
                  value={data.current_stage}
                  onChange={(v) => update('current_stage', v)}
                  options={STAGES}
                />
                <InputField
                  label="Substrat / Medium"
                  value={data.grow_medium}
                  onChange={(v) => update('grow_medium', v)}
                  options={GROW_MEDIA}
                />
              </div>

              {/* Light */}
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Beleuchtung</p>
                <div className="space-y-3">
                  <InputField
                    label="Lichttyp"
                    icon={Sun}
                    value={data.light_type}
                    onChange={(v) => update('light_type', v)}
                    options={LIGHT_TYPES}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Lichtstunden"
                      icon={Sun}
                      value={data.light_hours}
                      onChange={(v) => update('light_hours', v)}
                      placeholder="18"
                      unit="h/Tag"
                    />
                    <InputField
                      label="Abstand"
                      value={data.light_distance_cm}
                      onChange={(v) => update('light_distance_cm', v)}
                      placeholder="40"
                      unit="cm"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors"
              >
                {showAdvanced ? 'Weniger Parameter' : 'Erweiterte Parameter anzeigen'}
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="pH Abfluss"
                        value={data.ph_runoff}
                        onChange={(v) => update('ph_runoff', v)}
                        placeholder="6.0"
                      />
                      <InputField
                        label="EC / PPM"
                        icon={Zap}
                        value={data.ec_ppm}
                        onChange={(v) => update('ec_ppm', v)}
                        placeholder="800"
                        unit="ppm"
                      />
                      <InputField
                        label="CO₂"
                        value={data.co2_ppm}
                        onChange={(v) => update('co2_ppm', v)}
                        placeholder="400"
                        unit="ppm"
                      />
                      <InputField
                        label="PPFD"
                        icon={Sun}
                        value={data.light_intensity_ppfd}
                        onChange={(v) => update('light_intensity_ppfd', v)}
                        placeholder="600"
                        unit="µmol"
                      />
                      <InputField
                        label="Topfgröße"
                        value={data.pot_size_liters}
                        onChange={(v) => update('pot_size_liters', v)}
                        placeholder="11"
                        unit="L"
                      />
                      <InputField
                        label="Letzte Bewässerung"
                        icon={Droplets}
                        value={data.last_watering_hours_ago}
                        onChange={(v) => update('last_watering_hours_ago', v)}
                        placeholder="12"
                        unit="h her"
                      />
                    </div>
                    <InputField
                      label="Belüftung"
                      icon={Wind}
                      value={data.airflow}
                      onChange={(v) => update('airflow', v)}
                      options={AIRFLOW_OPTIONS}
                    />
                    <InputField
                      label="Letzter Dünger"
                      value={data.last_feeding}
                      onChange={(v) => update('last_feeding', v)}
                      type="text"
                      placeholder="z.B. BioBizz Bloom 2ml/L"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}