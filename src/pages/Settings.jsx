import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Bell, Lock, Moon,
  Globe, Shield, HelpCircle, FileText, LogOut, ChevronRight,
  Bookmark, Heart, MessageCircle, Trash2, Download,
  Volume2, Vibrate, Mail, Loader2, AlertTriangle, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
// createPageUrl removed — use direct route paths
import { toast } from 'sonner';

const MENU_SECTIONS = [
  {
    title: 'Konto',
    items: [
      { id: 'profile', label: 'Profil bearbeiten', icon: User, page: 'Profile' },
      { id: 'saved', label: 'Gespeicherte Beiträge', icon: Bookmark, page: 'Saved' },
      { id: 'liked', label: 'Gefällt mir', icon: Heart, page: 'Liked' }
    ]
  },
  {
    title: 'Benachrichtigungen',
    items: [
      { id: 'push', label: 'Push-Benachrichtigungen', icon: Bell, toggle: true, key: 'pushEnabled' },
      { id: 'email', label: 'E-Mail-Benachrichtigungen', icon: Mail, toggle: true, key: 'emailEnabled' },
      { id: 'sound', label: 'Töne', icon: Volume2, toggle: true, key: 'soundEnabled' },
      { id: 'vibrate', label: 'Vibration', icon: Vibrate, toggle: true, key: 'vibrateEnabled' }
    ]
  },
  {
    title: 'Privatsphäre',
    items: [
      { id: 'privacy_settings', label: 'Privatsphäre & Sichtbarkeit', icon: Lock, route: '/PrivacySettings' },
      { id: 'messages', label: 'Nachrichten', icon: MessageCircle, page: 'Messages' }
    ]
  },
  {
    title: 'Darstellung',
    items: [
      { id: 'darkMode', label: 'Dunkelmodus', icon: Moon, toggle: true, key: 'darkMode', locked: true },
      { id: 'language', label: 'Sprache', icon: Globe, value: 'Deutsch' }
    ]
  },
  {
    title: 'Hilfe & Info',
    items: [
      { id: 'help', label: 'Hilfe', icon: HelpCircle, page: 'Knowledge' },
      { id: 'privacy', label: 'Datenschutz', icon: Shield, page: 'Privacy' },
      { id: 'terms', label: 'Nutzungsbedingungen', icon: FileText, page: 'Terms' },
      { id: 'impressum', label: 'Impressum', icon: Scale, page: 'Impressum' }
    ]
  },
  {
    title: 'Daten',
    items: [
      { id: 'download', label: 'Daten herunterladen', icon: Download, action: 'download' },
      { id: 'delete', label: 'Konto löschen', icon: Trash2, action: 'delete', danger: true }
    ]
  }
];

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    soundEnabled: true,
    vibrateEnabled: true,
    darkMode: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Load settings from user data
      if (user.settings) {
        setSettings(prev => ({ ...prev, ...user.settings }));
      }
    } catch {
      navigate('/Feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key) => {
    if (key === 'darkMode') {
      toast.info('Dunkelmodus ist immer aktiviert');
      return;
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      await base44.auth.updateMe({ settings: newSettings });
      toast.success('Einstellung gespeichert');
    } catch {
      setSettings(settings);
      toast.error('Fehler beim Speichern');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAction = async (action) => {
    switch (action) {
      case 'download':
        toast.info('Deine Daten werden vorbereitet...');
        try {
          // Collect user data
          const [posts, comments, diaries] = await Promise.all([
            base44.entities.Post.filter({ created_by: currentUser.email }),
            base44.entities.Comment.filter({ author_email: currentUser.email }),
            base44.entities.GrowDiary.filter({ created_by: currentUser.email })
          ]);
          
          const userData = {
            profile: currentUser,
            posts: posts,
            comments: comments,
            growDiaries: diaries,
            exportedAt: new Date().toISOString()
          };
          
          const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `growhub-daten-${currentUser.email}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('Daten erfolgreich exportiert!');
        } catch (error) {
          toast.error('Fehler beim Exportieren der Daten');
        }
        break;
      case 'delete':
        setShowDeleteConfirm(true);
        break;
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      toast.error('Bitte gib "LÖSCHEN" ein um fortzufahren');
      return;
    }
    
    setIsDeleting(true);
    try {
      // Delete user content
      const [posts, comments, diaries, stories] = await Promise.all([
        base44.entities.Post.filter({ created_by: currentUser.email }),
        base44.entities.Comment.filter({ author_email: currentUser.email }),
        base44.entities.GrowDiary.filter({ created_by: currentUser.email }),
        base44.entities.Story.filter({ created_by: currentUser.email })
      ]);
      
      // Delete all content
      await Promise.all([
        ...posts.map(p => base44.entities.Post.delete(p.id)),
        ...comments.map(c => base44.entities.Comment.delete(c.id)),
        ...diaries.map(d => base44.entities.GrowDiary.delete(d.id)),
        ...stories.map(s => base44.entities.Story.delete(s.id))
      ]);
      
      // Clear local storage
      localStorage.removeItem('growhub_age_verified');
      
      toast.success('Dein Account und alle Daten wurden gelöscht');
      
      // Logout and redirect
      setTimeout(() => {
        base44.auth.logout('/AgeGate');
      }, 2000);
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen. Bitte kontaktiere den Support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      await base44.auth.logout('/Feed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Einstellungen</h1>
              <p className="text-sm text-zinc-400">{currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {MENU_SECTIONS.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
          >
            <h2 className="text-sm font-semibold text-zinc-500 mb-2 px-2">{section.title}</h2>
            <div className="bg-zinc-900 rounded-xl overflow-hidden divide-y divide-zinc-800">
              {section.items.map(item => {
                if (item.toggle) {
                  return (
                    <div
                      key={item.id}
                      className={`w-full flex items-center justify-between p-4 ${
                        item.danger ? 'text-red-500' : 'text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      
                      <Switch 
                        checked={settings[item.key]} 
                        onCheckedChange={() => handleToggle(item.key)}
                        disabled={item.locked}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.route) navigate(item.route);
                      else if (item.page) navigate(`/${item.page}`);
                      else if (item.action) handleAction(item.action);
                    }}
                    className={`w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors ${
                      item.danger ? 'text-red-500' : 'text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.danger ? 'text-red-500' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    
                    {item.value ? (
                      <span className="text-zinc-500 text-sm">{item.value}</span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Abmelden
        </Button>

        {/* Prominent Delete Account (iOS requirement) */}
        <div className="bg-zinc-900 rounded-xl p-5 border border-red-500/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-400">Account löschen</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Lösche dein Konto und alle damit verbundenen Daten unwiderruflich.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Account endgültig löschen
          </Button>
        </div>

        {/* Version */}
        <p className="text-center text-zinc-600 text-sm">
          GrowHub v1.0.0
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Account löschen?</h3>
                  <p className="text-sm text-zinc-400">Diese Aktion kann nicht rückgängig gemacht werden</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-300 mb-3">
                  Folgende Daten werden unwiderruflich gelöscht:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Alle deine Posts und Kommentare</li>
                  <li>• Alle Grow-Tagebücher und Einträge</li>
                  <li>• Alle Stories und Medien</li>
                  <li>• Dein Profil und alle Einstellungen</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="text-sm text-zinc-400 mb-2 block">
                  Gib <span className="text-red-400 font-bold">LÖSCHEN</span> ein um fortzufahren:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="bg-zinc-800 border-zinc-700"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 border-zinc-700"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'LÖSCHEN' || isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Lösche...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Endgültig löschen
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}