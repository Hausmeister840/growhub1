import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, Sparkles, Camera, X, 
  AlertCircle, RefreshCw, Leaf, CheckCircle, FileText, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

/**
 * 🤖 GROW MASTER CHAT - Verbesserte UI mit Error Handling
 */

const QUICK_PROMPTS = [
  { icon: Leaf, text: 'Wie erkenne ich Nährstoffmängel?', category: 'diagnose' },
  { icon: Lightbulb, text: 'Optimale Beleuchtung für Blütephase?', category: 'lighting' },
  { icon: AlertCircle, text: 'Was tun bei Schädlingsbefall?', category: 'pests' },
  { icon: FileText, text: 'Wann sollte ich ernten?', category: 'harvest' },
  { icon: Leaf, text: 'Welcher pH-Wert ist optimal für Erde?', category: 'ph' },
  { icon: Lightbulb, text: 'Wie viel VPD ist ideal in der Blüte?', category: 'vpd' },
  { icon: AlertCircle, text: 'Meine Blätter rollen sich ein – warum?', category: 'diagnose' },
  { icon: FileText, text: 'Wann ist der beste Zeitpunkt zum Toppen?', category: 'training' },
];

const EXAMPLE_QUESTIONS = [
  'Wie viel Wasser braucht meine Pflanze?',
  'Welcher pH-Wert ist optimal?',
  'Wann beginnt die Blütephase?',
  'Was bedeuten gelbe Blätter?',
  'Wie kann ich den Ertrag maximieren?'
];

export default function GrowMasterChat({ diaryId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ✅ Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ✅ Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hey! Ich bin der **Grow Master**, dein KI-Experte für Cannabis-Anbau.

Ich kann dir bei Folgendem helfen:
- 🔬 **Probleme diagnostizieren** (Nährstoffmängel, Schädlinge, etc.)
- 💡 **Tipps geben** (Beleuchtung, Bewässerung, Nährstoffe)
- 📸 **Fotos analysieren** (Lade ein Foto deiner Pflanze hoch)
- 🌱 **Grow-Fragen beantworten** (Jede Phase des Grows)

Was möchtest du wissen?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  // ✅ Image Upload Handler
  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) {
          uploadedUrls.push(file_url);
        }
      }
      
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} Bild(er) hochgeladen`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Send Message with Retry Logic
  const sendMessage = useCallback(async (messageText = input) => {
    if (!messageText.trim() && uploadedImages.length === 0) return;
    if (isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim() || '📸 *Foto gesendet*',
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('🤖 Sending to Grow Master:', { 
        prompt: messageText, 
        images: uploadedImages.length 
      });

      const response = await base44.functions.invoke('ai/routeCannabisAI', {
        prompt: messageText.trim() || 'Analysiere dieses Foto meiner Pflanze',
        file_urls: uploadedImages,
        context_options: {
          include_diaries: true,
          include_knowledge: true
        }
      });

      console.log('✅ Grow Master response:', response.data);

      // Fallback: direkt InvokeLLM wenn Backend-Funktion nicht antwortet
      let responseContent;
      if (response?.data?.success) {
        responseContent = response.data.response;
      } else {
        const fallback = await base44.integrations.Core.InvokeLLM({
          prompt: `Du bist der Grow Master, ein erfahrener Cannabis-Anbau-Experte. Antworte auf Deutsch, klar und praktisch.
          
Frage: ${messageText.trim() || 'Analysiere die Pflanze'}`,
          file_urls: uploadedImages.length > 0 ? uploadedImages : undefined,
        });
        responseContent = typeof fallback === 'string' ? fallback : JSON.stringify(fallback);
      }

      const aiMessage = {
        role: 'assistant',
        content: responseContent || 'Entschuldigung, ich konnte keine Antwort generieren.',
        timestamp: new Date().toISOString(),
        metadata: response?.data?.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
      setRetryCount(0);

    } catch (error) {
      console.error('❌ Grow Master error:', error);
      
      const errorMessage = {
        role: 'error',
        content: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
        timestamp: new Date().toISOString(),
        retryable: retryCount < 3
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(errorMessage);
      setRetryCount(prev => prev + 1);

      toast.error('Fehler beim Senden', {
        description: errorMessage.retryable ? 'Du kannst es nochmal versuchen' : 'Bitte später nochmal probieren'
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedImages, isLoading, retryCount]);

  // ✅ Retry Handler
  const handleRetry = useCallback(() => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    }
  }, [messages, sendMessage]);

  // ✅ Quick Prompt Handler
  const handleQuickPrompt = useCallback((promptText) => {
    setInput(promptText);
    textareaRef.current?.focus();
  }, []);

  // ✅ Remove Uploaded Image
  const removeImage = useCallback((index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ✅ Handle Enter Key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Grow Master</h3>
            <p className="text-xs text-zinc-400">KI-Experte für Cannabis-Anbau</p>
          </div>
          {isLoading && (
            <Loader2 className="w-4 h-4 text-green-400 animate-spin ml-auto" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'error' ? (
                <Card className="max-w-[85%] p-4 bg-red-500/10 border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-400 mb-2">{message.content}</p>
                      {message.retryable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRetry}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Nochmal versuchen
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className={`max-w-[85%] p-4 ${
                  message.role === 'user'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-zinc-900/50 border-zinc-800'
                }`}>
                  {/* User Images */}
                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {message.images.map((url, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={url}
                          alt="Uploaded"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : 'prose-zinc prose-invert'
                  }`}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="text-sm space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="text-sm space-y-1 my-2">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                        em: ({ children }) => <em className="text-green-400">{children}</em>,
                        code: ({ inline, children }) => 
                          inline ? (
                            <code className="px-1 py-0.5 bg-zinc-800 rounded text-green-400 text-xs">{children}</code>
                          ) : (
                            <code className="block p-2 bg-zinc-800 rounded text-xs overflow-x-auto">{children}</code>
                          ),
                        h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-2">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-sm font-bold text-white mt-2 mb-1">{children}</h4>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Metadata */}
                  {message.metadata && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                      <CheckCircle className="w-3 h-3" />
                      <span>Kontext: {message.metadata.context_used || 'Allgemein'}</span>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <Card className="p-4 bg-zinc-900/50 border-zinc-800">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                <span className="text-sm text-zinc-400">Grow Master denkt nach...</span>
              </div>
            </Card>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (nur wenn Chat leer) */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex-shrink-0 p-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">💡 Schnellstart:</p>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {QUICK_PROMPTS.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={index}
                  onClick={() => { handleQuickPrompt(prompt.text); sendMessage(prompt.text); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/40 rounded-xl text-xs text-zinc-300 transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">{prompt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900/30">
        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt="Upload"
                  className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 border-zinc-700 hover:bg-zinc-800"
          >
            <Camera className="w-5 h-5 text-zinc-400" />
          </Button>

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stelle eine Frage... (z.B. 'Wie viel Wasser braucht meine Pflanze?')"
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none bg-zinc-900 border-zinc-700 focus:border-green-500"
          />

          {/* Send Button */}
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
            className="flex-shrink-0 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Character Count */}
        {input.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2">
            {input.length} / 2000 Zeichen
          </p>
        )}
      </div>
    </div>
  );
}