import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, BellOff, Heart, MessageCircle, AtSign, 
  UserPlus, Rss, MessageSquare, Sprout, Volume2,
  ChevronLeft, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { notificationManager } from '../components/notifications/NotificationManager';
import { motion } from 'framer-motion';

const NOTIFICATION_OPTIONS = [
  {
    key: 'likes',
    icon: Heart,
    title: 'Likes',
    description: 'Wenn jemand deinen Post liked',
    color: 'text-red-400'
  },
  {
    key: 'comments',
    icon: MessageCircle,
    title: 'Kommentare',
    description: 'Wenn jemand deinen Post kommentiert',
    color: 'text-blue-400'
  },
  {
    key: 'mentions',
    icon: AtSign,
    title: 'Erwähnungen',
    description: 'Wenn du in einem Post erwähnt wirst',
    color: 'text-purple-400'
  },
  {
    key: 'new_followers',
    icon: UserPlus,
    title: 'Neue Follower',
    description: 'Wenn dir jemand folgt',
    color: 'text-green-400'
  },
  {
    key: 'followed_user_posts',
    icon: Rss,
    title: 'Neue Posts',
    description: 'Posts von Personen, denen du folgst',
    color: 'text-amber-400'
  },
  {
    key: 'messages',
    icon: MessageSquare,
    title: 'Nachrichten',
    description: 'Neue Direktnachrichten',
    color: 'text-cyan-400'
  },
  {
    key: 'grow_updates',
    icon: Sprout,
    title: 'Grow-Updates',
    description: 'Updates zu deinen Grow-Tagebüchern',
    color: 'text-lime-400'
  },
  {
    key: 'sound',
    icon: Volume2,
    title: 'Sound',
    description: 'Ton bei Benachrichtigungen',
    color: 'text-zinc-400'
  }
];

export default function NotificationSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    mentions: true,
    new_followers: true,
    followed_user_posts: true,
    messages: true,
    grow_updates: true,
    sound: true
  });
  const navigate = useNavigate();

  // Load user and settings
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        if (user.notification_settings) {
          setSettings(prev => ({
            ...prev,
            ...user.notification_settings
          }));
          setPushEnabled(user.notification_settings.push_enabled || false);
        }
        
        // Check browser permission
        if ('Notification' in window) {
          const permitted = Notification.permission === 'granted';
          if (permitted && !user.notification_settings?.push_enabled) {
            setPushEnabled(true);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        toast.error('Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleTogglePush = async () => {
    if (!pushEnabled) {
      // Enable
      const granted = await notificationManager.requestPermission();
      if (granted) {
        setPushEnabled(true);
        await saveSettings({ ...settings, push_enabled: true });
        toast.success('Push-Benachrichtigungen aktiviert!');
      }
    } else {
      // Disable
      await notificationManager.unsubscribe();
      setPushEnabled(false);
      await saveSettings({ ...settings, push_enabled: false });
      toast.success('Push-Benachrichtigungen deaktiviert');
    }
  };

  const handleToggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings) => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await User.update(currentUser.id, {
        notification_settings: {
          ...newSettings,
          push_enabled: pushEnabled
        }
      });
    } catch (error) {
      console.error('Error saving settings:', error);
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
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => navigate(createPageUrl('Profile'))}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Benachrichtigungen</h1>
            <p className="text-sm text-zinc-500">Verwalte deine Benachrichtigungen</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Master Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                pushEnabled ? 'bg-green-500' : 'bg-zinc-800'
              } transition-colors`}>
                {pushEnabled ? (
                  <Bell className="w-6 h-6 text-white" />
                ) : (
                  <BellOff className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">
                  Push-Benachrichtigungen
                </h2>
                <p className="text-sm text-zinc-400">
                  {pushEnabled 
                    ? 'Du erhältst Benachrichtigungen auf diesem Gerät'
                    : 'Aktiviere Benachrichtigungen, um nichts zu verpassen'
                  }
                </p>
                {!('Notification' in window) && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Dein Browser unterstützt keine Push-Benachrichtigungen
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handleTogglePush}
              disabled={!('Notification' in window) || isSaving}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </motion.div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-400 px-2">
            Benachrichtigungstypen
          </h3>

          {NOTIFICATION_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isEnabled = settings[option.key];

            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${option.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{option.title}</h4>
                      <p className="text-sm text-zinc-500">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleSetting(option.key)}
                    disabled={!pushEnabled || isSaving}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-1">
                Hinweis
              </h4>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                Du kannst Benachrichtigungen jederzeit in deinen Browser-Einstellungen 
                widerrufen. Einige Benachrichtigungen (wie wichtige System-Updates) 
                werden trotz deiner Einstellungen angezeigt.
              </p>
            </div>
          </div>
        </div>

        {/* Test Notification */}
        {pushEnabled && (
          <Button
            onClick={() => {
              notificationManager.showNotification('Test-Benachrichtigung', {
                body: 'Deine Benachrichtigungen funktionieren! 🎉',
                icon: '/icon-192.png'
              });
              toast.success('Test-Benachrichtigung gesendet!');
            }}
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800"
          >
            <Bell className="w-4 h-4 mr-2" />
            Test-Benachrichtigung senden
          </Button>
        )}
      </div>
    </div>
  );
}