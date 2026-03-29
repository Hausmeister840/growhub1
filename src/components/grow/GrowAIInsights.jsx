
import { motion } from 'framer-motion';
import { Brain, AlertCircle, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GrowAIInsights({ diary, onRequestAnalysis, isAnalyzing, title = "Analyse" }) {
  if (!diary) return null;

  const insights = diary.ai_insights;

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 border border-zinc-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          {title}
        </h3>
        {onRequestAnalysis && (
          <Button
            onClick={onRequestAnalysis}
            disabled={isAnalyzing}
            size="sm"
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Aktualisieren'
            )}
          </Button>
        )}
      </div>

      {insights && insights.last_analysis ? (
        <div className="space-y-4">
          {/* Health Score */}
          {insights.health_score != null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Gesundheitsscore</span>
                <span className={`text-lg font-bold ${getHealthColor(insights.health_score)}`}>
                  {insights.health_score}/100
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    insights.health_score >= 80 ? 'bg-green-500' :
                    insights.health_score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${insights.health_score}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {insights.last_analysis_summary && (
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-sm text-zinc-300">
                {insights.last_analysis_summary}
              </p>
            </div>
          )}

          {/* Issues */}
          {insights.current_issues && insights.current_issues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">Aktuelle Probleme</span>
              </div>
              <ul className="space-y-1">
                {insights.current_issues.map((issue, i) => (
                  <li key={i} className="text-sm text-zinc-400 ml-6">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">Empfehlungen</span>
              </div>
              <ul className="space-y-1">
                {insights.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-zinc-400 ml-6">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Predicted Harvest */}
          {insights.predicted_harvest_date && (
            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Erwartete Ernte</span>
              </div>
              <p className="text-sm text-white mt-1">
                {new Date(insights.predicted_harvest_date).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm mb-4">
            Noch keine Analyse verfügbar
          </p>
          {onRequestAnalysis && (
            <Button
              onClick={onRequestAnalysis}
              disabled={isAnalyzing}
              size="sm"
              className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Erste Analyse starten
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
