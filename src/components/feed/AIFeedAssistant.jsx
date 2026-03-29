import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Loader2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIFeedAssistant({ isOpen, onClose, currentUser, currentFeed }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const analyzeMyFeed = async () => {
    if (!currentUser) return;
    
    setIsAnalyzing(true);
    try {
      // Collect feed statistics
      const tags = currentFeed.flatMap(p => p.tags || []);
      const tagCounts = {};
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere mein Feed-Verhalten:
        
Aktuelle Posts im Feed: ${currentFeed.length}
User: ${currentUser.username || currentUser.email}
Häufigste Tags: ${topTags.join(', ')}
Content-Typen: ${currentFeed.map(p => p.type).join(', ')}

Basierend auf den Posts, gib mir:
1. Top 3 Themen die ich am meisten sehe
2. Empfohlene neue Themen/Tags zum Entdecken
3. Beste Zeit zum Posten für maximales Engagement
4. Persönliche Feed-Optimierungstipps`,
        response_json_schema: {
          type: "object",
          properties: {
            top_topics: {
              type: "array",
              items: { type: "string" }
            },
            recommended_topics: {
              type: "array",
              items: { type: "string" }
            },
            best_posting_time: { type: "string" },
            optimization_tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      toast.error('Analyse fehlgeschlagen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-900/20 rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">AI Feed Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!insights ? (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Lass die KI dein Feed-Verhalten analysieren und personalisierte Empfehlungen geben.
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={analyzeMyFeed}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Feed analysieren
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Topics */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                      Deine Top-Themen
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.top_topics?.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm rounded-xl"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      Neue Themen entdecken
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.recommended_topics?.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-300 text-sm rounded-xl"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Best Time */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs text-zinc-500 mb-1">Beste Posting-Zeit</p>
                    <p className="text-lg font-bold text-white">{insights.best_posting_time}</p>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/80 mb-3">Optimierungs-Tipps</h3>
                    <ul className="space-y-2">
                      {insights.optimization_tips?.map((tip, idx) => (
                        <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => setInsights(null)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-sm font-medium transition-colors"
                  >
                    Neu analysieren
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}