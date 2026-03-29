import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, Sparkles, Camera, X,
  AlertCircle, Leaf, Zap,
  Droplets, Sun, Wind, ThermometerSun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: Leaf, text: 'Nährstoffmangel erkennen', emoji: '🔬' },
  { icon: Sun, text: 'Beleuchtung optimieren', emoji: '💡' },
  { icon: Droplets, text: 'Bewässerung verbessern', emoji: '💧' },
  { icon: Wind, text: 'Schädlinge bekämpfen', emoji: '🐛' },
  { icon: ThermometerSun, text: 'Temperatur & Luftfeuchtigkeit', emoji: '🌡️' },
  { icon: Zap, text: 'Ertrag maximieren', emoji: '📈' }
];

export default function EnhancedGrowMasterChat({ diaryId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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
        content: `👋 **Grow Master** hier - dein KI-Cannabis-Experte!

📸 **NEU:** Lade mehrere Bilder gleichzeitig hoch für detaillierte Analysen

**Ich helfe dir bei:**
- 🔬 Problem-Diagnose (Mängel, Schädlinge, Krankheiten)
- 💡 Optimierungs-Tipps (Licht, Wasser, Nährstoffe)
- 📊 Wachstums-Tracking & Ernteplanung
- 🌱 Strain-spezifische Beratung

**Probier es aus:** Lade ein Foto hoch oder stelle eine Frage!`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  // ✅ Verbesserte Bild-Upload-Funktion
  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} ist zu groß (max 10MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileId = `${Date.now()}-${i}`;
        
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { name: file.name, progress: 0 }
        }));

        try {
          // Resize image before upload for better performance
          const resizedBlob = await resizeImage(file, 1920, 1920);
          
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { name: file.name, progress: 50 }
          }));

          const { file_url } = await base44.integrations.Core.UploadFile({ 
            file: resizedBlob 
          });

          if (file_url) {
            uploadedUrls.push(file_url);
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { name: file.name, progress: 100 }
            }));
          }
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          toast.error(`Fehler beim Hochladen: ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} Bild(er) erfolgreich hochgeladen! 📸`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, []);

  // ✅ Image Resize Utility
  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = useCallback(async (messageText = input) => {
    if (!messageText.trim() && uploadedImages.length === 0) return;
    if (isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim() || `📸 ${uploadedImages.length} Foto(s) zur Analyse`,
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedImages([]);
    setIsLoading(true);

    try {
      const prompt = messageText.trim() || 
        `Analysiere diese ${uploadedImages.length} Fotos meiner Cannabis-Pflanze(n). 
        Gib mir eine detaillierte Diagnose mit Empfehlungen.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: uploadedImages,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            health_score: { type: 'number' },
            issues: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  problem: { type: 'string' },
                  severity: { type: 'string' },
                  solution: { type: 'string' }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      const aiMessage = {
        role: 'assistant',
        content: formatAIResponse(response),
        timestamp: new Date().toISOString(),
        data: response
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Grow Master error:', error);
      
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Fehler bei der Analyse. Bitte versuche es erneut.',
        timestamp: new Date().toISOString()
      }]);

      toast.error('KI-Analyse fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedImages, isLoading]);

  const formatAIResponse = (data) => {
    if (!data) return 'Keine Antwort erhalten.';

    let formatted = '';

    if (data.analysis) {
      formatted += `${data.analysis}\n\n`;
    }

    if (data.health_score !== undefined) {
      const emoji = data.health_score >= 80 ? '🟢' : data.health_score >= 50 ? '🟡' : '🔴';
      formatted += `**Gesundheitsscore:** ${emoji} ${data.health_score}/100\n\n`;
    }

    if (data.issues && data.issues.length > 0) {
      formatted += `### 🔍 Erkannte Probleme:\n\n`;
      data.issues.forEach((issue, i) => {
        const severityEmoji = {
          'hoch': '🔴',
          'mittel': '🟡',
          'niedrig': '🟢'
        }[issue.severity?.toLowerCase()] || '⚠️';
        
        formatted += `${i + 1}. **${issue.problem}** ${severityEmoji}\n`;
        formatted += `   *Lösung:* ${issue.solution}\n\n`;
      });
    }

    if (data.recommendations && data.recommendations.length > 0) {
      formatted += `### 💡 Empfehlungen:\n\n`;
      data.recommendations.forEach((rec, i) => {
        formatted += `${i + 1}. ${rec}\n`;
      });
    }

    return formatted || data.analysis || 'Analyse abgeschlossen.';
  };

  const removeImage = useCallback((index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Grow Master
              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-medium">
                PRO
              </span>
            </h3>
            <p className="text-xs text-zinc-400">KI-Cannabis-Experte • Bild-Analyse aktiviert</p>
          </div>
          {isLoading && (
            <Loader2 className="w-5 h-5 text-green-400 animate-spin ml-auto" />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'error' ? (
                <Card className="max-w-[85%] p-4 bg-red-500/10 border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{message.content}</p>
                  </div>
                </Card>
              ) : (
                <Card className={`max-w-[85%] p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
                    : 'bg-zinc-900/80 border-zinc-800 backdrop-blur-sm'
                }`}>
                  {message.images && message.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {message.images.map((url, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={url}
                          alt="Uploaded"
                          className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                        />
                      ))}
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none prose-invert">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0 text-zinc-200">{children}</p>,
                        h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-2 flex items-center gap-2">{children}</h3>,
                        strong: ({ children }) => <strong className="font-bold text-green-400">{children}</strong>,
                        em: ({ children }) => <em className="text-emerald-400">{children}</em>,
                        ul: ({ children }) => <ul className="space-y-2 my-3">{children}</ul>,
                        li: ({ children }) => <li className="text-sm text-zinc-300 flex items-start gap-2"><span className="text-green-400 mt-1">•</span><span>{children}</span></li>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <Card className="p-4 bg-zinc-900/80 border-zinc-800">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                <span className="text-sm text-zinc-400">Analysiere Bilder mit KI...</span>
              </div>
            </Card>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900/30">
          <p className="text-xs text-zinc-500 mb-3">💡 Schnellstart:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(prompt.text);
                    textareaRef.current?.focus();
                  }}
                  className="justify-start text-left h-auto py-3 border-zinc-800 hover:bg-zinc-900 hover:border-green-500/30 transition-all"
                >
                  <span className="text-base mr-2">{prompt.emoji}</span>
                  <span className="text-xs">{prompt.text}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900/50">
        {/* Upload Progress */}
        {isUploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mb-3 space-y-2">
            {Object.entries(uploadProgress).map(([id, data]) => (
              <div key={id} className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                <div className="flex-1">
                  <div className="text-xs text-zinc-400 mb-1">{data.name}</div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${data.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt="Upload"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-green-500/30"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
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
            disabled={isLoading || isUploading}
            className="flex-shrink-0 border-zinc-700 hover:bg-zinc-800 hover:border-green-500/50 transition-all"
            title="Bilder hochladen (max 10MB pro Bild)"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-zinc-400" />
            )}
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stelle eine Frage oder lade Fotos hoch..."
            disabled={isLoading || isUploading}
            className="min-h-[44px] max-h-32 resize-none bg-zinc-900 border-zinc-700 focus:border-green-500 transition-all"
            maxLength={2000}
          />

          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || isUploading || (!input.trim() && uploadedImages.length === 0)}
            className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {input.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2">
            {input.length} / 2000 Zeichen
          </p>
        )}
      </div>
    </div>
  );
}