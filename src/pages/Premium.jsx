import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  { id: 'pro', name: 'Pro Grower', price: '9.99', features: ['5 Grow Tagebücher', '100 AI Analysen/Monat', 'Keine Werbung'] },
  { id: 'expert', name: 'Expert Cultivator', price: '24.99', features: ['20 Grow Tagebücher', '500 AI Analysen/Monat', 'Premium Analytics'] },
  { id: 'business', name: 'Business', price: '99.99', features: ['Unbegrenzt', 'White-Label', 'Dedicated Support'] },
];

export default function Premium() {
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const preferredPlan = search.get('plan') || 'pro';
  const source = search.get('source') || 'direct';
  const feature = search.get('feature') || 'Premium-Funktion';
  const [selectedPlan, setSelectedPlan] = useState(preferredPlan);
  const [loadingPlan, setLoadingPlan] = useState('');

  const startCheckout = async (planId) => {
    setLoadingPlan(planId);
    try {
      const response = await base44.functions.invoke('premium/createCheckoutIntent', {
        plan_id: planId,
        source,
        feature,
      });

      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
        return;
      }

      if (response?.fallback_url) {
        window.location.href = response.fallback_url;
        return;
      }

      toast.success('Abo-Anfrage wurde erstellt. Wir melden uns in Kürze.');
    } catch (error) {
      console.error('Checkout start failed:', error);
      toast.error('Checkout konnte nicht gestartet werden. Bitte später erneut versuchen.');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 md:py-14 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Sicherer Premium-Checkout
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Premium freischalten</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Du willst <span className="text-emerald-400">{feature}</span> nutzen. Wähle einen Plan und starte den Checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                className={`border ${selectedPlan === plan.id ? 'border-emerald-500' : 'border-zinc-800'} bg-zinc-900/60`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl text-white font-semibold">{plan.name}</h2>
                      {plan.id === 'expert' && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <p className="text-zinc-300">
                      <span className="text-3xl font-bold text-white">{plan.price}€</span> / Monat
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((item) => (
                      <li key={item} className="text-sm text-zinc-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      Auswählen
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => startCheckout(plan.id)}
                      disabled={loadingPlan.length > 0}
                    >
                      {loadingPlan === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Checkout'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center text-sm text-zinc-500">
          Aktuell gewählt: <span className="text-zinc-300">{selectedPlan}</span>
        </div>
      </div>
    </div>
  );
}
