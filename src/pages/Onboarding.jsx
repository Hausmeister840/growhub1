import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles, User, MapPin, Leaf, Upload } from 'lucide-react';
import { toast } from 'sonner';

const GROW_LEVELS = [
  { value: 'beginner', label: 'Anfänger', emoji: '🌱', desc: 'Ich fange gerade erst an' },
  { value: 'intermediate', label: 'Fortgeschritten', emoji: '🌿', desc: 'Ich habe schon ein paar Grows gemacht' },
  { value: 'advanced', label: 'Experte', emoji: '🌳', desc: 'Ich bin erfahren' },
  { value: 'expert', label: 'Profi', emoji: '🏆', desc: 'Ich bin ein Cannabis-Guru' }
];

const INTERESTS = [
  { key: 'indoor', label: 'Indoor Growing', emoji: '🏠' },
  { key: 'outdoor', label: 'Outdoor Growing', emoji: '🌞' },
  { key: 'strains', label: 'Sorten-Kunde', emoji: '🧬' },
  { key: 'medical', label: 'Medizinisches Cannabis', emoji: '⚕️' },
  { key: 'equipment', label: 'Grow-Equipment', emoji: '💡' },
  { key: 'nutrients', label: 'Nährstoffe & Dünger', emoji: '💧' },
  { key: 'community', label: 'Community & Networking', emoji: '👥' },
  { key: 'recipes', label: 'Rezepte & Edibles', emoji: '🍪' }
];

export default function Onboarding() {
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [growLevel, setGrowLevel] = useState('beginner');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Check if already onboarded
        if (user.username && user.bio) {
          navigate('/Feed', { replace: true });
          return;
        }

        // Pre-fill with existing data
        setUsername(user.username || '');
        setBio(user.bio || '');
        setLocation(user.location || '');
        setGrowLevel(user.grow_level || 'beginner');
        setSelectedInterests(user.interests || []);
        setAvatarPreview(user.avatar_url || null);

      } catch (error) {
        navigate('/Feed', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild zu groß (max 5MB)');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleInterest = (key) => {
    setSelectedInterests(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Bitte gib einen Benutzernamen ein');
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = currentUser.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = file_url;
      }

      await base44.auth.updateMe({
        username: username.trim(),
        bio: bio.trim() || 'Cannabis-Enthusiast 🌿',
        location: location.trim(),
        grow_level: growLevel,
        interests: selectedInterests,
        avatar_url: avatarUrl
      });

      toast.success('Profil erstellt!');
      navigate('/Feed', { replace: true });

    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Schritt {step} von {totalSteps}</span>
              <span className="text-sm text-green-400">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Basis-Infos */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Willkommen bei GrowHub!</h2>
                  <p className="text-zinc-400">Lass uns dein Profil einrichten</p>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500">Profilbild hochladen (optional)</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Benutzername *
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dein_username"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    maxLength={30}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Über mich
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Erzähl uns etwas über dich..."
                    className="bg-zinc-800 border-zinc-700 text-white resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-zinc-500 mt-1">{bio.length}/200</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Standort
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="z.B. Berlin, Deutschland"
                      className="bg-zinc-800 border-zinc-700 text-white pl-10"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Grow Level */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Wie erfahren bist du?</h2>
                  <p className="text-zinc-400">Hilft uns, dir relevante Inhalte zu zeigen</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GROW_LEVELS.map((level) => (
                    <motion.button
                      key={level.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGrowLevel(level.value)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        growLevel === level.value
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-4xl mb-3">{level.emoji}</div>
                      <h3 className="font-bold text-white mb-1">{level.label}</h3>
                      <p className="text-sm text-zinc-400">{level.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Interessen */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Wofür interessierst du dich?</h2>
                  <p className="text-zinc-400">Wähle mindestens 3 Themen</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.key);
                    return (
                      <motion.button
                        key={interest.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleInterest(interest.key)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <div className="text-2xl mb-2">{interest.emoji}</div>
                        <p className="text-sm font-medium text-white">{interest.label}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
            <Button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              variant="ghost"
              className="text-zinc-400"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Zurück
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!username.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Weiter
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || !username.trim() || selectedInterests.length < 3}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Speichere...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Fertig
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/Feed')}
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Später vervollständigen
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}