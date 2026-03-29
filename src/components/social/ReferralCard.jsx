import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Gift, Users, Copy, Check, Share2 
} from 'lucide-react';
import { toast } from 'sonner';
import { Referral } from '@/entities/Referral';

export default function ReferralCard({ user }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    rewards_earned: 0
  });

  // ✅ USE CALLBACK to memoize function
  const loadReferralStats = useCallback(async () => {
    if (!user) return;

    try {
      const referrals = await Referral.filter({
        referrer_email: user.email
      });

      const stats = {
        total: referrals.length,
        completed: referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
        pending: referrals.filter(r => r.status === 'pending').length,
        rewards_earned: referrals
          .filter(r => r.status === 'rewarded')
          .reduce((sum, r) => sum + (r.reward_amount || 0), 0)
      };

      setReferralStats(stats);
    } catch (error) {
      console.error('Load referral stats error:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Generate referral code
    const code = `GROW${user.id.substring(0, 8).toUpperCase()}`;
    setReferralCode(code);

    // Load referral stats
    loadReferralStats();
  }, [user, loadReferralStats]); // ✅ Include loadReferralStats in dependencies

  const handleCopy = () => {
    const link = `https://growhub.app/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const link = `https://growhub.app/signup?ref=${referralCode}`;
    const text = `🌱 Komm zu GrowHub - Der #1 Cannabis Community App!\n\nNutze meinen Code: ${referralCode}\n\n`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join GrowHub',
          text: text,
          url: link
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  if (!user) return null;

  return (
    <Card className="glass-card border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Gift className="w-5 h-5 text-green-400" />
          Freunde einladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
            <p className="text-2xl font-bold text-green-400">
              {referralStats.completed}
            </p>
            <p className="text-xs text-zinc-500">Erfolgreich</p>
          </div>
          <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
            <p className="text-2xl font-bold text-yellow-400">
              {referralStats.pending}
            </p>
            <p className="text-xs text-zinc-500">Ausstehend</p>
          </div>
          <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
            <p className="text-2xl font-bold text-purple-400">
              {referralStats.rewards_earned}
            </p>
            <p className="text-xs text-zinc-500">XP verdient</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Dein Referral-Code:</p>
          <div className="flex gap-2">
            <Input
              value={`https://growhub.app/signup?ref=${referralCode}`}
              readOnly
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-zinc-800"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Teilen
          </Button>
        </div>

        {/* Rewards Info */}
        <div className="glass-card p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">
                Verdiene Belohnungen!
              </p>
              <p className="text-xs text-zinc-400">
                Lade Freunde ein und erhalte <span className="text-green-400 font-bold">500 XP + 100 Coins</span> pro erfolgreichem Referral!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}