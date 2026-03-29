import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Brain, Sparkles } from 'lucide-react';
import { agentSDK } from '@/agents';
import MessageBubble from './MessageBubble';
import { toast } from 'sonner';

export default function AgentMessageArea({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentTyping]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    console.log('🔔 Subscribing to agent conversation:', conversation.id);

    const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
      console.log('📨 Agent conversation update:', data);
      
      if (data.messages) {
        setMessages(data.messages);
        
        // Check if agent is currently processing
        const lastMessage = data.messages[data.messages.length - 1];
        const isAgentProcessing = lastMessage?.role === 'user' && 
          !data.messages.some(m => m.role === 'assistant' && m.created_date > lastMessage.created_date);
        
        setIsAgentTyping(isAgentProcessing);
      }
    });

    return () => {
      console.log('🔇 Unsubscribing from agent conversation');
      unsubscribe();
    };
  }, [conversation?.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !conversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    setIsAgentTyping(true);

    try {
      console.log('📤 Sending message to agent:', messageText);
      
      await agentSDK.addMessage(conversation, {
        role: 'user',
        content: messageText
      });

      // Focus zurück zur Textarea nach dem Senden
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('❌ Failed to send message to agent:', error);
      toast.error('Nachricht konnte nicht gesendet werden');
      setNewMessage(messageText); // Nachricht zurücksetzen bei Fehler
      setIsAgentTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const agentName = conversation?.metadata?.agent_display_name || '🤖 KI-Assistent';
  const agentIcon = conversation?.metadata?.agent_icon || '🤖';

  return (
    <div className="flex flex-col h-full">
      {/* Agent Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-zinc-400 hover:text-white"
          >
            ←
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg">
              {agentIcon}
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                {agentName}
                <Brain className="w-4 h-4 text-purple-400" />
              </h3>
              <p className="text-xs text-zinc-400">
                {isAgentTyping ? 'Analysiert und antwortet...' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAgentTyping && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble 
              key={message.id || message.created_date} 
              message={{
                ...message,
                // Ensure agent messages are properly formatted
                role: message.role === 'assistant' ? 'assistant' : 'user'
              }} 
            />
          ))}
        </AnimatePresence>

        {/* Agent Typing Indicator */}
        <AnimatePresence>
          {isAgentTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm">
                {agentIcon}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 rounded-2xl">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-zinc-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-zinc-400 ml-2">Grow-Meister analysiert...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Frage den ${agentName.replace('🌱 ', '')}...`}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-400 resize-none min-h-[60px] max-h-32"
              disabled={isSending}
              rows={2}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 h-[60px] px-6"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        
        <p className="text-xs text-zinc-500 mt-2 text-center">
          💡 Tipp: Frage nach deinen Grow-Tagebüchern oder beschreibe ein Problem mit deinen Pflanzen
        </p>
      </div>
    </div>
  );
}