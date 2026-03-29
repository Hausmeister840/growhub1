import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PrivacyToggleRow from '../components/settings/PrivacyToggleRow';
import PrivacySelectRow from '../components/settings/PrivacySelectRow';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Alle', desc: 'Jeder kann es sehen' },
  { value: 'followers', label: 'Follower', desc: 'Nur deine Follower' },
  { value: 'private', label: 'Nur ich', desc: 'Niemand außer dir' },
];

const MESSAGE_OPTIONS = [
  { value: 'everyone', label: 'Alle', desc: 'Jeder kann dir schreiben' },
  { value: 'followers', label: 'Follower', desc: 'Nur Follower' },
  { value: 'nobody', label: 'Niemand', desc: 'Nachrichten deaktiviert' },
];

export default function PrivacySettings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Local state mirrors user privacy fields
  const [privacy, setPrivacy] = useState({
    privacy_mode: 'public',
    show_posts: 'public',
    show_grow_diaries: 'public',
    show_plant_scans: 'private',
    show_achievements: 'public',
    show_activity_status: true,
    show_followers_list: true,
    allow_messages_from: 'everyone',
    allow_mentions: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        setPrivacy({
          privacy_mode: me.privacy_mode || 'public',
          show_posts: me.show_posts || 'public',
          show_grow_diaries: me.show_grow_diaries || 'public',
          show_plant_scans: me.show_plant_scans || 'private',
          show_achievements: me.show_achievements || 'public',
          show_activity_status: me.show_activity_status !== false,
          show_followers_list: me.show_followers_list !== false,
          allow_messages_from: me.allow_messages_from || 'everyone',
          allow_mentions: me.allow_mentions !== false,
        });
      } catch {
        navigate('/Settings');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate]);

  const save = async (key, value) => {
    const prev = privacy[key];
    setPrivacy(p => ({ ...p, [key]: value }));
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ [key]: value });
      toast.success('Gespeichert');
    } catch {
      setPrivacy(p => ({ ...p, [key]: prev }));
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-[52px] lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/Settings')} className="p-2 -ml-2 hover:bg-zinc-800/60 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Privatsphäre & Sichtbarkeit</h1>
          {isSaving && <Loader2 className="w-4 h-4 text-green-500 animate-spin ml-auto" />}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account-Sichtbarkeit */}
        <Section title="Konto" delay={0}>
          <PrivacySelectRow
            label="Profil-Sichtbarkeit"
            description="Bestimmt wer dein Profil sehen kann"
            value={privacy.privacy_mode}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => save('privacy_mode', v)}
          />
        </Section>

        {/* Inhalte */}
        <Section title="Inhalte" delay={0.05}>
          <PrivacySelectRow
            label="Beiträge"
            description="Wer kann deine Posts auf deinem Profil sehen"
            value={privacy.show_posts}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => save('show_posts', v)}
          />
          <PrivacySelectRow
            label="Grow-Tagebücher"
            description="Wer kann deine Grows sehen"
            value={privacy.show_grow_diaries}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => save('show_grow_diaries', v)}
          />
          <PrivacySelectRow
            label="Pflanzen-Scans"
            description="Wer kann deine KI-Scans sehen"
            value={privacy.show_plant_scans}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => save('show_plant_scans', v)}
          />
          <PrivacySelectRow
            label="Erfolge & Badges"
            description="Wer kann deine Achievements sehen"
            value={privacy.show_achievements}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => save('show_achievements', v)}
          />
        </Section>

        {/* Interaktion */}
        <Section title="Interaktion" delay={0.1}>
          <PrivacySelectRow
            label="Nachrichten erlauben von"
            description="Wer kann dir Nachrichten senden"
            value={privacy.allow_messages_from}
            options={MESSAGE_OPTIONS}
            onChange={(v) => save('allow_messages_from', v)}
          />
          <PrivacyToggleRow
            label="Erwähnungen erlauben"
            description="Andere können dich in Posts erwähnen"
            value={privacy.allow_mentions}
            onChange={(v) => save('allow_mentions', v)}
          />
        </Section>

        {/* Sichtbarkeit */}
        <Section title="Sichtbarkeit" delay={0.15}>
          <PrivacyToggleRow
            label="Online-Status anzeigen"
            description="Andere sehen wann du aktiv warst"
            value={privacy.show_activity_status}
            onChange={(v) => save('show_activity_status', v)}
          />
          <PrivacyToggleRow
            label="Follower-Liste anzeigen"
            description="Andere können deine Follower/Following sehen"
            value={privacy.show_followers_list}
            onChange={(v) => save('show_followers_list', v)}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">{title}</h2>
      <div className="bg-zinc-900/60 rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}