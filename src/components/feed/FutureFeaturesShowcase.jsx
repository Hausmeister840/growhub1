import { motion } from 'framer-motion';
import { Sparkles, Zap, Brain, Globe, Shield, Leaf, Coins, Users, Layers, Eye } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Hyper-Personalisierung', color: 'from-purple-500 to-pink-500', status: 'active' },
  { icon: Zap, title: 'Edge Computing', color: 'from-cyan-500 to-blue-500', status: 'active' },
  { icon: Shield, title: 'Quantum-Verschlüsselung', color: 'from-indigo-500 to-purple-500', status: 'active' },
  { icon: Leaf, title: '100% Grüne Server', color: 'from-green-500 to-emerald-500', status: 'active' },
  { icon: Coins, title: 'Attention Economy', color: 'from-yellow-500 to-orange-500', status: 'active' },
  { icon: Users, title: 'DAO Governance', color: 'from-blue-500 to-purple-500', status: 'active' },
  { icon: Layers, title: 'AR/VR Integration', color: 'from-pink-500 to-rose-500', status: 'beta' },
  { icon: Eye, title: 'Biometrische Gates', color: 'from-red-500 to-pink-500', status: 'beta' },
  { icon: Globe, title: 'Dezentrale Identität', color: 'from-teal-500 to-cyan-500', status: 'active' },
  { icon: Sparkles, title: 'Multi-Sensory Content', color: 'from-violet-500 to-purple-500', status: 'beta' }
];

export default function FutureFeaturesShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold">2030 Features</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group"
            >
              <div className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer">
                <div className={`p-2 bg-gradient-to-br ${feature.color} rounded-lg w-fit mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-white font-medium leading-tight mb-1">
                  {feature.title}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  feature.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    feature.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  } animate-pulse`} />
                  {feature.status === 'active' ? 'Aktiv' : 'Beta'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-xs text-zinc-600">
          Powered by Future-Ready Technology Stack 2030
        </p>
      </div>
    </motion.div>
  );
}