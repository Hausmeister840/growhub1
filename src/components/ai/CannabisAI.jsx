
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Sparkles, 
  Camera, 
  Lightbulb, 
  TrendingUp, 
  Send, 
  Loader2, 
  CheckCircle,
  Target,
  Calendar,
  Bug,
  FlaskConical,
  Star
} from 'lucide-react';
import { InvokeLLM, UploadFile } from '@/integrations/Core';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const aiFeatures = [
  {
    id: 'plant_doctor',
    name: '🌿 Pflanzen-Doktor',
    description: 'Lade ein Foto hoch und ich diagnostiziere Probleme',
    icon: Camera,
    color: 'from-green-500 to-emerald-600',
    category: 'diagnosis'
  },
  {
    id: 'grow_advisor',
    name: '📈 Grow-Berater',
    description: 'Personalisierte Anbau-Strategien und Tipps',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-600',
    category: 'advice'
  },
  {
    id: 'strain_matcher',
    name: '🎯 Strain-Finder',
    description: 'Finde die perfekte Sorte für deine Bedürfnisse',
    icon: Target,
    color: 'from-purple-500 to-pink-600',
    category: 'recommendations'
  },
  {
    id: 'harvest_predictor',
    name: '⏰ Harvest-Timer',
    description: 'Vorhersage des optimalen Erntezeitpunkts',
    icon: Calendar,
    color: 'from-orange-500 to-red-600',
    category: 'prediction'
  },
  {
    id: 'problem_solver',
    name: '🔧 Problem-Löser',
    description: 'Schritt-für-Schritt Lösungen für alle Probleme',
    icon: Lightbulb,
    color: 'from-yellow-500 to-amber-600',
    category: 'troubleshooting'
  },
  {
    id: 'nutrient_calculator',
    name: '⚗️ Nährstoff-Rechner',
    description: 'Berechne die perfekte Nährstoff-Mischung',
    icon: FlaskConical,
    color: 'from-teal-500 to-green-600',
    category: 'nutrients'
  }
];

const quickQuestions = [
  "Meine Blätter werden gelb - was tun?",
  "Welche Strain ist am einfachsten anzubauen?",
  "Wann sollte ich ernten?",
  "Wie erkenne ich männliche Pflanzen?",
  "Optimale Temperatur und Luftfeuchtigkeit?",
  "LST vs. SCROG - was ist besser?"
];

export default function CannabisAI({ currentUser, onClose, initialFeature = null }) {
  const [activeFeature, setActiveFeature] = useState(initialFeature);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [plantStage, setPlantStage] = useState('');
  const [growMedium, setGrowMedium] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const { toast } = useToast();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte lade nur Bilder hoch');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bild zu groß. Maximum 10MB');
      return;
    }

    setIsProcessing(true);
    try {
      const { file_url } = await UploadFile({ file });
      setUploadedImage(file_url);
      toast.success('Bild hochgeladen! 📸');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIRequest = useCallback(async (feature, input, imageUrl = null) => {
    if (!currentUser) {
      toast.error('Bitte logge dich ein für KI-Features');
      return;
    }

    setIsProcessing(true);
    
    try {
      let prompt = '';
      let responseSchema = {};

      switch (feature) {
        case 'plant_doctor':
          prompt = `Du bist ein Experte für Cannabis-Anbau. Analysiere das hochgeladene Bild einer Cannabis-Pflanze.
          
          Zusätzliche Infos:
          - Wachstumsstadium: ${plantStage || 'Nicht angegeben'}
          - Anbaumedium: ${growMedium || 'Nicht angegeben'}
          - Benutzerfrage: ${input || 'Keine spezielle Frage'}
          
          Gib eine detaillierte Diagnose mit konkreten Handlungsempfehlungen.`;
          
          responseSchema = {
            type: "object",
            properties: {
              diagnosis: { type: "string", description: "Hauptdiagnose des Problems" },
              confidence: { type: "number", description: "Vertrauen in die Diagnose (0-100)" },
              severity: { type: "string", enum: ["niedrig", "mittel", "hoch", "kritisch"] },
              causes: { type: "array", items: { type: "string" }, description: "Mögliche Ursachen" },
              solutions: { type: "array", items: { type: "string" }, description: "Konkrete Lösungsschritte" },
              prevention: { type: "array", items: { type: "string" }, description: "Präventionsmaßnahmen" },
              timeline: { type: "string", description: "Zeitrahmen für Besserung" },
              urgency: { type: "string", description: "Dringlichkeit der Behandlung" }
            },
            required: ["diagnosis", "confidence", "severity", "causes", "solutions"]
          };
          break;

        case 'grow_advisor':
          prompt = `Du bist ein professioneller Cannabis-Grow-Berater. 
          
          Benutzer-Kontext:
          - Level: ${currentUser.grow_level || 'Anfänger'}
          - Interessen: ${currentUser.interests?.join(', ') || 'Allgemein'}
          - Frage/Situation: ${input}
          
          Gib personalisierte, actionable Grow-Ratschläge.`;
          
          responseSchema = {
            type: "object", 
            properties: {
              advice_type: { type: "string", description: "Art der Beratung" },
              recommendations: { type: "array", items: { type: "string" }, description: "Hauptempfehlungen" },
              difficulty: { type: "string", enum: ["Anfänger", "Fortgeschritten", "Experte"] },
              estimated_cost: { type: "string", description: "Geschätzte Kosten" },
              timeline: { type: "string", description: "Zeitrahmen für Umsetzung" },
              tools_needed: { type: "array", items: { type: "string" }, description: "Benötigte Werkzeuge/Materialien" },
              tips: { type: "array", items: { type: "string" }, description: "Zusätzliche Pro-Tipps" },
              warnings: { type: "array", items: { type: "string" }, description: "Wichtige Warnungen" }
            },
            required: ["advice_type", "recommendations", "difficulty"]
          };
          break;

        case 'strain_matcher':
          prompt = `Du bist ein Cannabis-Strain-Experte. Basierend auf folgenden Präferenzen:
          
          ${input}
          
          Empfehle die 3 besten Strains mit detaillierter Begründung.`;
          
          responseSchema = {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    strain_name: { type: "string" },
                    type: { type: "string", enum: ["Indica", "Sativa", "Hybrid"] },
                    thc_range: { type: "string" },
                    effects: { type: "array", items: { type: "string" } },
                    growing_difficulty: { type: "string", enum: ["Einfach", "Mittel", "Schwer"] },
                    flowering_time: { type: "string" },
                    yield: { type: "string" },
                    why_recommended: { type: "string" },
                    perfect_for: { type: "array", items: { type: "string" } }
                  },
                  required: ["strain_name", "type", "effects", "why_recommended"]
                }
              },
              matching_score: { type: "number", description: "Wie gut die Empfehlungen passen (0-100)" }
            },
            required: ["recommendations"]
          };
          break;

        case 'harvest_predictor':
          if (!imageUrl) {
            throw new Error('Bild erforderlich für Harvest-Vorhersage');
          }
          prompt = `Analysiere das Bild dieser Cannabis-Pflanze und bestimme den optimalen Erntezeitpunkt.
          
          Zusätzliche Infos: ${input}
          
          Bewerte Trichome, Pistils und allgemeinen Reifegrad.`;
          
          responseSchema = {
            type: "object",
            properties: {
              harvest_readiness: { type: "number", description: "Ernte-Bereitschaft in Prozent (0-100)" },
              estimated_days_left: { type: "number", description: "Geschätzte Tage bis zur Ernte" },
              trichome_status: { type: "string", description: "Zustand der Trichome" },
              pistil_status: { type: "string", description: "Zustand der Pistils" },
              recommendations: { type: "array", items: { type: "string" }, description: "Empfehlungen für die nächsten Schritte" },
              harvest_window: { type: "string", description: "Optimales Ernte-Fenster" },
              effects_prediction: { type: "string", description: "Erwartete Wirkung bei aktueller Reife" }
            },
            required: ["harvest_readiness", "estimated_days_left", "recommendations"]
          };
          break;

        case 'problem_solver':
          prompt = `Du bist ein Cannabis-Troubleshooting-Experte. Problem: ${input}
          
          Gib eine strukturierte Schritt-für-Schritt Lösung mit verschiedenen Schwierigkeitsgraden.`;
          
          responseSchema = {
            type: "object",
            properties: {
              problem_category: { type: "string" },
              quick_fix: { type: "array", items: { type: "string" }, description: "Schnelle Notlösungen" },
              detailed_solution: { type: "array", items: { type: "string" }, description: "Detaillierte Schritte" },
              prevention: { type: "array", items: { type: "string" }, description: "Prävention für die Zukunft" },
              when_to_worry: { type: "string", description: "Ab wann wird es kritisch" },
              success_indicators: { type: "array", items: { type: "string" }, description: "Anzeichen für erfolgreiche Behandlung" }
            },
            required: ["problem_category", "detailed_solution"]
          };
          break;

        case 'nutrient_calculator':
          prompt = `Du bist ein Nährstoff-Experte für Cannabis. Berechne die optimale Nährstoff-Zusammensetzung für:
          
          ${input}
          
          Gib konkrete ppm/EC-Werte und Mischungsverhältnisse.`;
          
          responseSchema = {
            type: "object",
            properties: {
              nutrient_schedule: {
                type: "object",
                properties: {
                  nitrogen: { type: "string" },
                  phosphorus: { type: "string" },
                  potassium: { type: "string" },
                  ec_range: { type: "string" },
                  ph_range: { type: "string" }
                }
              },
              feeding_frequency: { type: "string" },
              mixing_instructions: { type: "array", items: { type: "string" } },
              monitoring_tips: { type: "array", items: { type: "string" } },
              deficiency_signs: { type: "array", items: { type: "string" } }
            },
            required: ["nutrient_schedule", "feeding_frequency", "mixing_instructions"]
          };
          break;

        default:
          throw new Error('Unbekannte AI-Funktion');
      }

      const result = await InvokeLLM({
        prompt,
        file_urls: imageUrl ? [imageUrl] : undefined,
        response_json_schema: responseSchema
      });

      setCurrentResult({ feature, result, timestamp: Date.now() });
      
      // Add to chat history
      setChatHistory(prev => [...prev, {
        type: 'user',
        content: input || 'Bild-Analyse',
        timestamp: Date.now()
      }, {
        type: 'ai',
        content: result,
        feature,
        timestamp: Date.now()
      }]);

      toast.success('🤖 KI-Analyse abgeschlossen!');

    } catch (error) {
      console.error('AI processing error:', error);
      toast.error('KI-Verarbeitung fehlgeschlagen. Versuche es erneut.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, toast, plantStage, growMedium]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeFeature || (!userInput.trim() && !uploadedImage)) return;
    
    await processAIRequest(activeFeature, userInput, uploadedImage);
    setUserInput('');
  };

  const handleQuickQuestion = async (question) => {
    setUserInput(question);
    setActiveFeature('grow_advisor');
    await processAIRequest('grow_advisor', question);
  };

  const renderResult = () => {
    if (!currentResult) return null;

    const { feature, result } = currentResult;
    
    switch (feature) {
      case 'plant_doctor':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${
                result.severity === 'kritisch' ? 'bg-red-500/20' :
                result.severity === 'hoch' ? 'bg-orange-500/20' :
                result.severity === 'mittel' ? 'bg-yellow-500/20' : 'bg-green-500/20'
              }`}>
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Diagnose: {result.diagnosis}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge className={`${
                    result.severity === 'kritisch' ? 'bg-red-500/20 text-red-400' :
                    result.severity === 'hoch' ? 'bg-orange-500/20 text-orange-400' :
                    result.severity === 'mittel' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {result.severity} Schweregrad
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {result.confidence}% Sicherheit
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Ursachen
                </h4>
                <ul className="space-y-1">
                  {result.causes?.map((cause, i) => (
                    <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Lösungen
                </h4>
                <ul className="space-y-1">
                  {result.solutions?.map((solution, i) => (
                    <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.timeline && (
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium">
                  ⏱️ Erwartete Besserung: {result.timeline}
                </p>
              </div>
            )}
          </motion.div>
        );

      case 'strain_matcher':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {result.recommendations?.map((strain, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{strain.strain_name}</h3>
                  <div className="flex gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400">{strain.type}</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400">{strain.growing_difficulty}</Badge>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Eigenschaften</h4>
                    <p className="text-zinc-300 text-sm mb-2">THC: {strain.thc_range}</p>
                    <p className="text-zinc-300 text-sm mb-2">Blütezeit: {strain.flowering_time}</p>
                    {strain.yield && <p className="text-zinc-300 text-sm">Ertrag: {strain.yield}</p>}
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-400 mb-2">Wirkung</h4>
                    <div className="flex flex-wrap gap-1">
                      {strain.effects?.map((effect, i) => (
                        <Badge key={i} className="bg-cyan-500/20 text-cyan-400 text-xs">
                          {effect}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm font-medium mb-1">
                    Warum empfohlen:
                  </p>
                  <p className="text-zinc-300 text-sm">{strain.why_recommended}</p>
                </div>
              </div>
            ))}
          </motion.div>
        );

      case 'harvest_predictor':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(75 85 99)" strokeWidth="8"/>
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke="rgb(249 115 22)" strokeWidth="8"
                    strokeDasharray={`${result.harvest_readiness * 2.83} 283`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-400">
                    {result.harvest_readiness}%
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ernte-Bereitschaft</h3>
              <p className="text-orange-400 font-semibold">
                Noch ca. {result.estimated_days_left} Tage bis zur optimalen Ernte
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Trichome Status</h4>
                <p className="text-zinc-300 text-sm">{result.trichome_status}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-pink-400 mb-2">Pistil Status</h4>
                <p className="text-zinc-300 text-sm">{result.pistil_status}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Nächste Schritte
              </h4>
              <ul className="space-y-2">
                {result.recommendations?.map((rec, i) => (
                  <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );

      // Add other result renderers...
      default:
        return (
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <pre className="text-zinc-300 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <Brain className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">KI-Features verfügbar</h3>
        <p className="text-zinc-400 mb-4">Logge dich ein, um den Cannabis-AI-Assistenten zu nutzen</p>
      </div>
    );
  }

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
        className="bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Cannabis AI Assistent</h2>
              <p className="text-zinc-400 text-sm">Dein intelligenter Grow-Companion</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="text-zinc-400 text-2xl">×</span>
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Feature Selection Sidebar */}
          <div className="w-80 border-r border-zinc-800/50 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">AI-Features</h3>
            <div className="space-y-3">
              {aiFeatures.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    activeFeature === feature.id
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-zinc-100 text-sm">{feature.name}</span>
                  </div>
                  <p className="text-zinc-400 text-xs">{feature.description}</p>
                </button>
              ))}
            </div>

            {/* Quick Questions */}
            <div className="mt-8">
              <h4 className="text-md font-semibold text-zinc-100 mb-3">Häufige Fragen</h4>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left p-3 text-sm text-zinc-300 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Input Area */}
            {activeFeature && (
              <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {aiFeatures.find(f => f.id === activeFeature)?.name}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Image Upload for visual features */}
                  {(['plant_doctor', 'harvest_predictor'].includes(activeFeature)) && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="image-upload">
                        📸 Pflanzenfoto hochladen
                      </label>
                      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          name="plant_image"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          {uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto rounded-lg" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                              <p className="text-zinc-400">Klicke hier um ein Bild hochzuladen</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Additional context inputs */}
                  {activeFeature === 'plant_doctor' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Wachstumsstadium</label>
                        <Select value={plantStage} onValueChange={setPlantStage} name="plant_stage">
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Wähle Stadium" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="keimling">Keimling</SelectItem>
                            <SelectItem value="wachstum">Vegetatives Wachstum</SelectItem>
                            <SelectItem value="bluete">Blütephase</SelectItem>
                            <SelectItem value="ernte">Vor der Ernte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Anbaumedium</label>
                        <Select value={growMedium} onValueChange={setGrowMedium} name="grow_medium">
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder="Wähle Medium" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="erde">Erde</SelectItem>
                            <SelectItem value="coco">Coco</SelectItem>
                            <SelectItem value="hydro">Hydroponik</SelectItem>
                            <SelectItem value="aero">Aeroponik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Text Input */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="ai-user-input">
                      Deine Frage oder Beschreibung
                    </label>
                    <Textarea
                      id="ai-user-input"
                      name="ai_user_input"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={`Beschreibe dein Problem oder stelle eine Frage zum ${aiFeatures.find(f => f.id === activeFeature)?.name}...`}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]"
                      autoComplete="off"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || (!userInput.trim() && !uploadedImage)}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        KI analysiert...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Analyse starten
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {!activeFeature && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">Wähle ein KI-Feature</h3>
                  <p className="text-zinc-400">Klicke links auf eine der verfügbaren KI-Funktionen</p>
                </div>
              )}
              
              <AnimatePresence>
                {currentResult && renderResult()}
              </AnimatePresence>

              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-zinc-100 mb-4">Verlauf</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatHistory.map((entry, index) => (
                      <div key={index} className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md p-3 rounded-lg ${
                          entry.type === 'user' 
                            ? 'bg-green-500/20 text-green-100' 
                            : 'bg-zinc-800/50 text-zinc-300'
                        }`}>
                          <p className="text-sm">{
                            entry.type === 'user' ? entry.content : 
                            entry.feature === 'plant_doctor' ? `Diagnose: ${entry.content.diagnosis}` :
                            entry.feature === 'strain_matcher' ? `${entry.content.recommendations?.length || 0} Strains empfohlen` :
                            'KI-Antwort erhalten'
                          }</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
