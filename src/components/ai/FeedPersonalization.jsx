
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { X, Brain, Target, Zap, Users, BookOpen, TrendingUp, Heart, Star, Award, Settings, Loader2 } from 'lucide-react';
import { User } from '@/entities/User';
import { useToast } from '@/components/ui/toast';

const personalityTypes = [
  {
    key: "balanced",
    name: "Ausgewogen",
    icon: Target,
    description: "Eine Mischung aus allem - perfekt für den Alltag",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  {
    key: "explorer",
    name: "Entdecker",
    icon: TrendingUp,
    description: "Neue Trends, experimentelle Methoden und innovative Ideen",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10"
  },
  {
    key: "social",
    name: "Community-Fokus",
    icon: Users,
    description: "Diskussionen, Fragen und lebendiger Austausch",
    color: "text-green-400",
    bgColor: "bg-green-500/10"
  },
  {
    key: "educational",
    name: "Lernmodus",
    icon: BookOpen,
    description: "Tutorials, Guides und wissenschaftliche Inhalte",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10"
  },
  {
    key: "conservative",
    name: "Bewährt & Sicher",
    icon: Award,
    description: "Erprobte Methoden und hochwertige, verifizierte Inhalte",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10"
  }
];

const contentCategories = [
  { key: "grow_diary", label: "Grow-Tagebücher", icon: "🌱" },
  { key: "strain_review", label: "Strain-Reviews", icon: "🌿" },
  { key: "education", label: "Bildung & Wissen", icon: "📚" },
  { key: "product", label: "Produkte & Gear", icon: "🛒" },
  { key: "general", label: "Allgemeine Diskussion", icon: "💬" },
  { key: "event", label: "Events & Meetups", icon: "🎉" }
];

export default function FeedPersonalization({ user, onClose, onUpdate }) {
  const [personality, setPersonality] = useState(user.feed_personality || "balanced");
  const [interests, setInterests] = useState(user.interests || []);
  const [contentPreferences, setContentPreferences] = useState({
    showBeginner: user.feed_settings?.showBeginner ?? true,
    showExpert: user.feed_settings?.showExpert ?? true,
    showCommunity: user.feed_settings?.showCommunity ?? true,
    minEngagement: user.feed_settings?.minEngagement || 0,
    prioritizeFollowing: user.feed_settings?.prioritizeFollowing ?? true,
    aiEnhancement: user.feed_settings?.aiEnhancement ?? true
  });
  const [categoryWeights, setCategoryWeights] = useState(
    user.feed_settings?.categoryWeights || contentCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: 50 }), {})
  );
  const [isSaving, setIsSaving] = useState(false);
  // Assuming useToast now returns an object with success and error methods.
  // If useToast typically returns { toast: Function }, this line might need adjustment
  // depending on the actual implementation of '@/components/ui/toast'.
  // For the requested `toast.success` syntax, `toast` itself must be the object
  // containing `success` and `error` methods.
  const toast = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        feed_personality: personality,
        interests,
        feed_settings: {
          ...contentPreferences,
          categoryWeights
        }
      };

      await User.updateMyUserData(settings);

      onUpdate({
        personality,
        filters: {
          categories: Object.entries(categoryWeights).filter(([_, weight]) => weight > 30).map(([key, _]) => key),
          minEngagement: contentPreferences.minEngagement,
          prioritizeFollowing: contentPreferences.prioritizeFollowing
        }
      });

      // FIX: use standardized toast API
      toast.success("🤖 Feed-Personalisierung gespeichert!");
      onClose();
    } catch (error) {
      console.error("Error saving personalization:", error);
      // FIX: use standardized toast API
      toast.error("Fehler beim Speichern der Einstellungen.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const selectedPersonality = personalityTypes.find(p => p.key === personality);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Feed Personalisierung</h2>
              <p className="text-zinc-400 text-sm">Optimiere deinen persönlichen Feed</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} type="button">
            <X className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Personality Selection */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Feed-Persönlichkeit
              </CardTitle>
              <p className="text-zinc-400 text-sm">Wähle den Stil, der zu dir passt</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personalityTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setPersonality(type.key)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        personality === type.key
                          ? `${type.bgColor} border-current ${type.color}`
                          : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${personality === type.key ? type.color : 'text-zinc-400'}`} />
                        <div>
                          <h4 className="font-semibold mb-1">{type.name}</h4>
                          <p className="text-xs opacity-80">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPersonality && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl ${selectedPersonality.bgColor} border border-current/30`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${selectedPersonality.color}`}>
                    <selectedPersonality.icon className="w-4 h-4" />
                    <span className="font-semibold">Gewählte Persönlichkeit: {selectedPersonality.name}</span>
                  </div>
                  <p className="text-sm opacity-90">{selectedPersonality.description}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Content Preferences */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Content-Einstellungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Weights */}
              <div>
                <h4 className="text-zinc-200 font-medium mb-4 flex items-center gap-2" id="cat-weights-label">
                  <Target className="w-4 h-4 text-green-400" />
                  Inhalts-Kategorien (Gewichtung)
                </h4>
                <div className="space-y-4" role="group" aria-labelledby="cat-weights-label">
                  {contentCategories.map(category => (
                    <div key={category.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-lg" aria-hidden="true">{category.icon}</span>
                        <label htmlFor={`slider-${category.key}`} className="text-zinc-300 text-sm">
                          {category.label}
                        </label>
                      </div>
                      <div className="flex items-center gap-3 w-32">
                        <Slider
                          id={`slider-${category.key}`}
                          name={`weight_${category.key}`}
                          aria-label={`Gewichtung ${category.label}`}
                          value={[categoryWeights[category.key] || 50]}
                          onValueChange={([value]) => setCategoryWeights(prev => ({ ...prev, [category.key]: value }))}
                          max={100}
                          step={10}
                          className="flex-1"
                        />
                        <span className="text-xs text-zinc-400 w-8 text-right" aria-live="polite">
                          {categoryWeights[category.key] || 50}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Filter */}
              <div>
                <h4 className="text-zinc-200 font-medium mb-3 flex items-center gap-2" id="min-engagement-label">
                  <Heart className="w-4 h-4 text-red-400" />
                  Mindest-Engagement
                </h4>
                <div className="flex items-center justify-between" role="group" aria-labelledby="min-engagement-label">
                  <span className="text-zinc-400 text-sm">Posts mit mindestens X Likes anzeigen</span>
                  <div className="flex items-center gap-3">
                    <Slider
                      id="slider-min-engagement"
                      name="min_engagement"
                      aria-label="Mindest-Likes"
                      value={[contentPreferences.minEngagement]}
                      onValueChange={([value]) => setContentPreferences(prev => ({ ...prev, minEngagement: value }))}
                      max={20}
                      step={1}
                      className="w-24"
                    />
                    <span className="text-zinc-300 font-mono w-8">
                      {contentPreferences.minEngagement}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="switch-prioritize-following" className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-zinc-300">Gefolgten Accounts priorisieren</span>
                  </label>
                  <Switch
                    id="switch-prioritize-following"
                    name="prioritize_following"
                    checked={contentPreferences.prioritizeFollowing}
                    onCheckedChange={(checked) => setContentPreferences(prev => ({ ...prev, prioritizeFollowing: checked }))}
                    aria-label="Gefolgten Accounts priorisieren"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="switch-ai-enhancement" className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-zinc-300">Intelligente Verbesserungen</span>
                  </label>
                  <Switch
                    id="switch-ai-enhancement"
                    name="ai_enhancement"
                    checked={contentPreferences.aiEnhancement}
                    onCheckedChange={(checked) => setContentPreferences(prev => ({ ...prev, aiEnhancement: checked }))}
                    aria-label="Intelligente Verbesserungen"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="switch-show-beginner" className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-zinc-300">Anfänger-Content anzeigen</span>
                  </label>
                  <Switch
                    id="switch-show-beginner"
                    name="show_beginner"
                    checked={contentPreferences.showBeginner}
                    onCheckedChange={(checked) => setContentPreferences(prev => ({ ...prev, showBeginner: checked }))}
                    aria-label="Anfänger-Content anzeigen"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="switch-show-expert" className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-zinc-300">Experten-Content anzeigen</span>
                  </label>
                  <Switch
                    id="switch-show-expert"
                    name="show_expert"
                    checked={contentPreferences.showExpert}
                    onCheckedChange={(checked) => setContentPreferences(prev => ({ ...prev, showExpert: checked }))}
                    aria-label="Experten-Content anzeigen"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Deine Interessen
              </CardTitle>
              <p className="text-zinc-400 text-sm">Wähle Themen, die dich interessieren</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Indoor Growing", "Outdoor Growing", "Hydroponic", "Organic",
                  "LED Lighting", "Nutrients", "Pest Control", "Harvesting",
                  "Strain Reviews", "Medical Cannabis", "Edibles", "Extracts",
                  "Growing Tips", "Equipment Reviews", "Troubleshooting"
                ].map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      interests.includes(interest)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-transparent'
                    }`}
                    type="button"
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/50 p-6">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">
              Änderungen werden sofort auf deinen Feed angewendet
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="grow-gradient" type="button">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Einstellungen speichern
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
