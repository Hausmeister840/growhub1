import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Leaf, MessageCircle } from 'lucide-react';
import { agentSDK } from '@/agents';

const AVAILABLE_AGENTS = [
  {
    name: 'GrowMaster',
    displayName: '🌱 Grow-Meister',
    description: 'Dein persönlicher Cannabis-Anbau-Experte. Analysiert deine Grow-Tagebücher und gibt maßgeschneiderte Ratschläge.',
    icon: Leaf,
    color: 'from-green-500 to-emerald-600',
    capabilities: ['Grow-Analyse', 'Problemdiagnose', 'Optimierung', 'Wissensbasis'],
    exampleQuestions: [
      'Analysiere mein aktuelles Grow-Tagebuch',
      'Warum werden meine Blätter gelb?', 
      'Wie kann ich meinen Ertrag optimieren?',
      'Ist mein pH-Wert in den letzten Tagen okay?'
    ]
  }
  // Hier können später weitere Agenten hinzugefügt werden
];

export default function AgentConversationStarter({ currentUser, onConversationCreated }) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const startAgentConversation = async (agent) => {
    if (!currentUser || isCreating) return;

    setIsCreating(true);

    try {
      console.log('🤖 Starting conversation with agent:', agent.name);
      
      const conversation = await agentSDK.createConversation({
        agent_name: agent.name,
        metadata: {
          name: `Chat mit ${agent.displayName}`,
          description: `Persönliche Beratung durch ${agent.displayName}`,
          agent_display_name: agent.displayName,
          agent_icon: '🌱',
          created_by: currentUser.email
        }
      });

      console.log('✅ Agent conversation created:', conversation);

      // Begrüßungsnachricht vom Agenten senden
      const welcomeMessage = `Hallo ${currentUser.full_name || 'Grower'}! 🌱 

Ich bin dein persönlicher Grow-Meister und freue mich darauf, dir bei allem rund um den Cannabis-Anbau zu helfen! 

Ich kann:
• 📊 Deine Grow-Tagebücher analysieren
• 🔍 Pflanzenprobleme diagnostizieren  
• 💡 Optimierungsvorschläge geben
• 📚 Passende Wissensartikel empfehlen

**Was beschäftigt dich heute bei deinem Grow?** Stelle einfach deine Frage oder bitte mich, einen Blick in deine aktuellen Tagebücher zu werfen! 🚀`;

      await agentSDK.addMessage(conversation, {
        role: 'assistant',
        content: welcomeMessage
      });

      if (onConversationCreated) {
        onConversationCreated(conversation);
      }

    } catch (error) {
      console.error('❌ Failed to create agent conversation:', error);
      // Hier könntest du einen Toast oder eine andere Fehlermeldung anzeigen
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center">
          <Brain className="w-6 h-6 text-purple-400" />
          KI-Assistenten
        </h3>
        <p className="text-zinc-400 text-sm mt-2">
          Starte eine Unterhaltung mit einem unserer spezialisierten KI-Experten
        </p>
      </div>

      {AVAILABLE_AGENTS.map((agent) => {
        const IconComponent = agent.icon;
        
        return (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="cursor-pointer"
            onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
          >
            <Card className="glass-card border-zinc-800/50 hover:border-green-500/30 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{agent.displayName}</h4>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          startAgentConversation(agent);
                        }}
                        disabled={isCreating}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-sm px-4 py-2"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {isCreating ? 'Wird erstellt...' : 'Chat starten'}
                      </Button>
                    </div>
                    
                    <p className="text-zinc-400 text-sm mt-1 mb-3">
                      {agent.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="px-2 py-1 bg-zinc-800/50 text-zinc-300 text-xs rounded-md"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>

                    {selectedAgent === agent.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-3 border-t border-zinc-800"
                      >
                        <p className="text-zinc-400 text-sm mb-2">Beispiel-Fragen:</p>
                        <div className="space-y-1">
                          {agent.exampleQuestions.map((question, index) => (
                            <div
                              key={index}
                              className="text-sm text-zinc-300 bg-zinc-800/30 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Hier könntest du die Frage direkt als erste Nachricht senden
                                startAgentConversation(agent).then(() => {
                                  // Nach der Konversationserstellung die Beispiel-Frage senden
                                  // Das würde in der Parent-Komponente gehandhabt werden
                                });
                              }}
                            >
                              💬 {question}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}