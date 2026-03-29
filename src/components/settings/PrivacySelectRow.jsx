import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PrivacySelectRow({ label, description, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0 mr-3">
          <p className="text-[14px] font-medium text-white">{label}</p>
          <p className="text-[12px] text-zinc-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[13px] text-green-400 font-medium">{selected.label}</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden bg-black/40"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div>
                  <p className="text-[13px] text-white">{opt.label}</p>
                  <p className="text-[11px] text-zinc-600">{opt.desc}</p>
                </div>
                {value === opt.value && <Check className="w-4 h-4 text-green-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}