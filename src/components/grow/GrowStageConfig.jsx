// Shared stage configuration used across all grow diary components
export const STAGES = [
  { id: 'Keimung', emoji: '🌱', label: 'Keimung', color: 'yellow' },
  { id: 'Sämling', emoji: '🌿', label: 'Sämling', color: 'lime' },
  { id: 'Wachstum', emoji: '🌳', label: 'Wachstum', color: 'green' },
  { id: 'Blüte', emoji: '🌸', label: 'Blüte', color: 'purple' },
  { id: 'Spülung', emoji: '💧', label: 'Spülung', color: 'blue' },
  { id: 'Ernte', emoji: '🏆', label: 'Ernte', color: 'orange' },
];

export const STAGE_STYLES = {
  Keimung:  { bg: 'bg-yellow-500/15', text: 'text-yellow-300', border: 'border-yellow-500/30', dot: 'bg-yellow-400', gradient: 'from-yellow-500 to-yellow-600' },
  Sämling:  { bg: 'bg-lime-500/15',   text: 'text-lime-300',   border: 'border-lime-500/30',   dot: 'bg-lime-400',   gradient: 'from-lime-500 to-lime-600' },
  Wachstum: { bg: 'bg-green-500/15',  text: 'text-green-300',  border: 'border-green-500/30',  dot: 'bg-green-400',  gradient: 'from-green-500 to-green-600' },
  Blüte:    { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', dot: 'bg-purple-400', gradient: 'from-purple-500 to-purple-600' },
  Spülung:  { bg: 'bg-blue-500/15',   text: 'text-blue-300',   border: 'border-blue-500/30',   dot: 'bg-blue-400',   gradient: 'from-blue-500 to-blue-600' },
  Ernte:    { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', dot: 'bg-orange-400', gradient: 'from-orange-500 to-orange-600' },
};

export const getStageStyle = (stage) => STAGE_STYLES[stage] || STAGE_STYLES.Keimung;
export const getStageEmoji = (stage) => STAGES.find(s => s.id === stage)?.emoji || '🌱';

export const QUICK_ACTION_LABELS = {
  watered: '💧 Gegossen', fertilized: '🧪 Gedüngt', repotted: '🪴 Umgetopft',
  topped: '✂️ Getoppt', lst: '🔗 LST', defoliated: '🍃 Entlaubt',
  flower_start: '🌸 Blüte', problem: '⚠️ Problem', harvest: '🏆 Ernte', other: '📝 Sonstiges',
};

export const HEALTH_MAP = {
  excellent: { label: 'Exzellent', emoji: '🟢', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  good:      { label: 'Gut',       emoji: '🟡', color: 'text-lime-400',  bg: 'bg-lime-500/15 border-lime-500/30' },
  fair:      { label: 'Mäßig',     emoji: '🟠', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  poor:      { label: 'Schlecht',  emoji: '🔴', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  critical:  { label: 'Kritisch',  emoji: '🚨', color: 'text-red-400',   bg: 'bg-red-500/15 border-red-500/30' },
};