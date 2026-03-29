import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Shield, Zap, Brain, Settings } from 'lucide-react';
import MoodSelector from './MoodSelector';
import SmartFilters from './SmartFilters';
import FeedLayoutSwitcher from './FeedLayoutSwitcher';
import TokenRewardDisplay from './TokenRewardDisplay';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import EdgeAnalyticsDisplay from './EdgeAnalyticsDisplay';
import FutureFeaturesShowcase from './FutureFeaturesShowcase';

export default function CommandCenter({ 
  isOpen, 
  onClose, 
  currentUser,
  currentMood,
  onMoodChange,
  activeFilters,
  onFiltersChange,
  feedLayout,
  onLayoutChange,
  onShowPrivacyCenter,
  onShowContentGenerator
}) {
  const [activeSection, setActiveSection] = useState('personalize');

  const sections = [
    { id: 'personalize', label: 'Personalisierung', icon: Sparkles },
    { id: 'analytics', label: 'Analysen', icon: TrendingUp },
    { id: 'features', label: 'Features', icon: Zap },
    { id: 'tools', label: 'Tools', icon: Settings }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute left-0 top-0 h-full w-full max-w-md bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-r border-white/10 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Command Center
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeSection === section.id
                        ? 'bg-green-500 text-black'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {activeSection === 'personalize' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {currentUser && <TokenRewardDisplay currentUser={currentUser} />}
                
                <MoodSelector 
                  currentMood={currentMood} 
                  onMoodChange={onMoodChange}
                />
                
                <SmartFilters
                  activeFilters={activeFilters}
                  onFiltersChange={onFiltersChange}
                />

                <FeedLayoutSwitcher
                  currentLayout={feedLayout}
                  onLayoutChange={onLayoutChange}
                />
              </motion.div>
            )}

            {activeSection === 'analytics' && currentUser && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <AdvancedAnalyticsDashboard currentUser={currentUser} />
                <EdgeAnalyticsDisplay />
              </motion.div>
            )}

            {activeSection === 'features' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FutureFeaturesShowcase />
              </motion.div>
            )}

            {activeSection === 'tools' && currentUser && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={() => {
                    onShowPrivacyCenter();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-medium transition-all group"
                >
                  <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Datenschutz-Center</div>
                    <div className="text-xs text-zinc-500">Verwalte deine Privatsphäre</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onShowContentGenerator();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-2xl text-white font-medium transition-all group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">AI Content Creator</div>
                    <div className="text-xs text-zinc-500">Erstelle KI-generierte Inhalte</div>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}