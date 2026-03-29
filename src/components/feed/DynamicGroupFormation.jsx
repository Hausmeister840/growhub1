import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DynamicGroupFormation({ currentUser, currentFeed }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!currentUser || currentFeed.length < 10) return;
    
    generateGroupSuggestions();
  }, [currentUser, currentFeed]);

  const generateGroupSuggestions = async () => {
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Basierend auf diesen Feed-Daten, schlage 3 temporäre Interessengruppen vor:
        
User: ${currentUser.username}
Posts im Feed: ${currentFeed.slice(0, 20).map(p => p.tags?.join(', ')).join(' | ')}

Erstelle kreative Gruppennamen und Beschreibungen für spontane Communities.`,
        response_json_schema: {
          type: "object",
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  estimated_members: { type: "number" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.groups || []);
      if (response.groups?.length > 0) {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Group suggestions failed:', error);
    }
  };

  const joinGroup = async (group) => {
    toast.success(`Gruppe "${group.name}" beigetreten! 🎉`);
    setShowSuggestions(false);
  };

  return (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Dynamische Gruppen</h3>
                <p className="text-xs text-zinc-500">KI-generierte Communities für dich</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Ausblenden
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.map((group, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group cursor-pointer"
                onClick={() => joinGroup(group)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1 flex items-center gap-2">
                      {group.name}
                      <span className="text-xs text-zinc-500">
                        ~{group.estimated_members} Mitglieder
                      </span>
                    </h4>
                    <p className="text-sm text-zinc-400 mb-2">{group.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {group.tags?.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}