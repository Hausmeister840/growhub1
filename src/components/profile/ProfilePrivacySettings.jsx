import { Eye, Users, Lock, Sprout, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Öffentlich', icon: Eye },
  { value: 'followers', label: 'Nur Follower', icon: Users },
  { value: 'private', label: 'Privat', icon: Lock },
];

export default function ProfilePrivacySettings({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Privatsphäre</h3>

      {/* Profile Visibility */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-sm font-medium text-white">Profil-Sichtbarkeit</p>
            <p className="text-xs text-zinc-500">Wer kann dein Profil sehen?</p>
          </div>
        </div>
        <Select
          value={formData.privacy_mode || 'public'}
          onValueChange={(val) => onChange({ ...formData, privacy_mode: val })}
        >
          <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grow Diary Visibility */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sprout className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium text-white">Grow-Tagebücher</p>
            <p className="text-xs text-zinc-500">Sichtbarkeit deiner Grows</p>
          </div>
        </div>
        <Select
          value={formData.show_grow_diaries || 'public'}
          onValueChange={(val) => onChange({ ...formData, show_grow_diaries: val })}
        >
          <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-white">Aktivitätsstatus</p>
            <p className="text-xs text-zinc-500">Zeige wann du online bist</p>
          </div>
        </div>
        <Switch
          checked={formData.show_activity_status !== false}
          onCheckedChange={(val) => onChange({ ...formData, show_activity_status: val })}
          className="data-[state=checked]:bg-green-600"
        />
      </div>
    </div>
  );
}