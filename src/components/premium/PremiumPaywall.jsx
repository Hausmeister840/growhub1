import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Crown, Check, Zap, TrendingUp, Shield, Sparkles, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro Grower',
    price: '9.99',
    currency: '€',
    interval: 'Monat',
    popular: true,
    features: [
      '5 Grow Tagebücher',
      '100 AI Analysen/Monat',
      'Erweiterte Analytics',
      'Prioritäts-Support',
      '10 GB Cloud Storage',
      '10% Marketplace Gebühr',
      'Keine Werbung'
    ],
    icon: Zap,
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'expert',
    name: 'Expert Cultivator',
    price: '24.99',
    currency: '€',
    interval: 'Monat',
    popular: false,
    features: [
      '20 Grow Tagebücher',
      '500 AI Analysen/Monat',
      'Premium Analytics Dashboard',
      'Persönlicher Grow Coach',
      '50 GB Cloud Storage',
      '5% Marketplace Gebühr',
      'API Zugang',
      'Custom Branding'
    ],
    icon: Crown,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'business',
    name: 'Business',
    price: '99.99',
    currency: '€',
    interval: 'Monat',
    popular: false,
    features: [
      'Unbegrenzte Tagebücher',
      'Unbegrenzte AI Analysen',
      'White-Label Lösung',
      'Dedicated Account Manager',
      '200 GB Cloud Storage',
      'Keine Marketplace Gebühr',
      'Multi-User Accounts',
      'Priority Feature Requests'
    ],
    icon: TrendingUp,
    color: 'from-orange-500 to-red-600'
  }
];

export default function PremiumPaywall({ 
  isOpen, 
  onClose, 
  featureName,
  requiredPlan 
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Upgrade zu Premium
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {featureName ? (
              <>
                <span className="text-green-400 font-semibold">{featureName}</span> erfordert einen {requiredPlan} Plan
              </>
            ) : (
              'Schalte alle Features frei und werde Teil der Elite-Grower Community'
            )}
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-card rounded-3xl p-6 border-2 ${
                plan.popular 
                  ? 'border-green-500 shadow-lg shadow-green-500/20' 
                  : 'border-zinc-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  ⭐ Beliebteste Wahl
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-xl text-zinc-400">
                    {plan.currency}/{plan.interval}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-300">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => {
                  const query = new URLSearchParams({
                    plan: plan.id,
                    source: 'paywall',
                    requiredPlan: requiredPlan || plan.id,
                    feature: featureName || 'premium-feature',
                  });
                  navigate(`/Premium?${query.toString()}`);
                }}
                className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold py-6 rounded-xl`}
              >
                {plan.popular ? '🚀 Jetzt upgraden' : 'Wählen'}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">30 Tage Geld-zurück-Garantie</p>
          </div>
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Jederzeit kündbar</p>
          </div>
          <div className="text-center">
            <Crown className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Über 10.000+ zufriedene Grower</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}