import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield, Database } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    moderationRequired: true,
    autoModeration: true,
    notificationsEnabled: true,
    maxFileSize: 10,
    maxPostLength: 5000,
    rateLimitPosts: 10,
    rateLimitComments: 30
  });

  const handleSave = () => {
    // In real app: Save to backend
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    toast.success("Einstellungen gespeichert");
  };

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-green-500" />
          <h3 className="font-bold text-white text-lg">Systemeinstellungen</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Wartungsmodus</p>
              <p className="text-sm text-zinc-400">App für Nutzer sperren</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Registrierung aktiviert</p>
              <p className="text-sm text-zinc-400">Neue Nutzer können sich registrieren</p>
            </div>
            <Switch
              checked={settings.registrationEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Benachrichtigungen</p>
              <p className="text-sm text-zinc-400">Push-Benachrichtigungen aktivieren</p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
            />
          </div>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-500" />
          <h3 className="font-bold text-white text-lg">Moderationseinstellungen</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Manuelle Moderation</p>
              <p className="text-sm text-zinc-400">Alle Posts manuell prüfen</p>
            </div>
            <Switch
              checked={settings.moderationRequired}
              onCheckedChange={(checked) => setSettings({ ...settings, moderationRequired: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Auto-Moderation</p>
              <p className="text-sm text-zinc-400">KI-gestützte Content-Prüfung</p>
            </div>
            <Switch
              checked={settings.autoModeration}
              onCheckedChange={(checked) => setSettings({ ...settings, autoModeration: checked })}
            />
          </div>
        </div>
      </div>

      {/* Content Limits */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-purple-500" />
          <h3 className="font-bold text-white text-lg">Content-Limits</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Maximale Dateigröße (MB)
            </label>
            <Input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Maximale Post-Länge (Zeichen)
            </label>
            <Input
              type="number"
              value={settings.maxPostLength}
              onChange={(e) => setSettings({ ...settings, maxPostLength: parseInt(e.target.value) })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Rate Limit: Posts pro Stunde
            </label>
            <Input
              type="number"
              value={settings.rateLimitPosts}
              onChange={(e) => setSettings({ ...settings, rateLimitPosts: parseInt(e.target.value) })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Rate Limit: Kommentare pro Stunde
            </label>
            <Input
              type="number"
              value={settings.rateLimitComments}
              onChange={(e) => setSettings({ ...settings, rateLimitComments: parseInt(e.target.value) })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-8 py-6 text-lg"
        >
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
}