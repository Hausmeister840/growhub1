import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Camera, X, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

function buildDiaryContext(diary, entries) {
  if (!diary) return '';
  const latestEntry = entries?.[0];
  const overdueTasks = (diary.grow_plan?.tasks || []).filter(
    t => t.next_due && new Date(t.next_due).getTime() < Date.now()
  );

  let ctx = `AKTUELLER GROW-KONTEXT:
- Pflanze: ${diary.strain_name}
- Phase: ${diary.current_stage}
- Methode: ${diary.grow_method} (${diary.setup_type})
- Pflanzenanzahl: ${diary.plant_count}
- Grow-Tag: ${Math.max(0, Math.floor((Date.now() - new Date(diary.start_date).getTime()) / 86400000))}
- Einträge: ${entries?.length || 0}`;

  if (diary.grow_plan) {
    const p = diary.grow_plan;
    ctx += `\n\nAKTUELLER ANBAUPLAN:`;
    if (p.watering) ctx += `\n- Gießen: alle ${p.watering.interval_hours}h, ${p.watering.amount_ml}ml, pH ${p.watering.ph_target}`;
    if (p.feeding) ctx += `\n- Düngen: alle ${p.feeding.interval_days}T, EC ${p.feeding.ec_target}, NPK ${p.feeding.npk_ratio}`;
    if (p.lighting) ctx += `\n- Licht: ${p.lighting.hours_on}/${p.lighting.hours_off}h, ${p.lighting.ppfd_target} PPFD`;
    if (p.environment) ctx += `\n- Klima: ${p.environment.temp_min}-${p.environment.temp_max}°C, ${p.environment.humidity_min}-${p.environment.humidity_max}% rH`;
  }

  if (overdueTasks.length > 0) {
    ctx += `\n\n⚠️ ÜBERFÄLLIGE AUFGABEN: ${overdueTasks.map(t => t.title).join(', ')}`;
  }

  if (latestEntry) {
    ctx += `\n\nLETZTER EINTRAG (Tag ${latestEntry.day_number}):`;
    if (latestEntry.plant_observation) ctx += `\n- Beobachtung: ${latestEntry.plant_observation}`;
    if (latestEntry.environment_data?.temp_c) ctx += `\n- Temperatur: ${latestEntry.environment_data.temp_c}°C`;
    if (latestEntry.environment_data?.humidity_rh) ctx += `\n- Feuchte: ${latestEntry.environment_data.humidity_rh}%`;
    if (latestEntry.feeding_data?.ph) ctx += `\n- pH: ${latestEntry.feeding_data.ph}`;
    if (latestEntry.feeding_data?.ec_ppm) ctx += `\n- EC: ${latestEntry.feeding_data.ec_ppm}`;
    if (latestEntry.ai_analysis?.health_assessment) ctx += `\n- Gesundheit: ${latestEntry.ai_analysis.health_assessment}`;
  }

  return ctx;
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-green-500/15 border border-green-500/25'
          : isError
            ? 'bg-red-500/10 border border-red-500/25'
            : 'bg-zinc-900/80 border border-zinc-800'
      }`}>
        {message.images?.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto">
            {message.images.map((url, i) => (
              <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        )}

        {isError ? (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{message.content}</p>
          </div>
        ) : isUser ? (
          <p className="text-sm text-white leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0 text-zinc-200">{children}</p>,
                ul: ({ children }) => <ul className="text-sm space-y-1 my-2 list-disc ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm space-y-1 my-2 list-decimal ml-4">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-zinc-300">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                em: ({ children }) => <em className="text-green-400 not-italic">{children}</em>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-white mt-3 mb-1">{children}</h3>,
                code: ({ children }) => <code className="px-1 py-0.5 bg-zinc-800 rounded text-green-400 text-xs">{children}</code>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SmartGrowAssistant({ diary, entries }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const diaryContext = useMemo(() => buildDiaryContext(diary, entries), [diary, entries]);

  // Welcome message
  useEffect(() => {
    const stage = diary?.current_stage || 'Wachstum';
    const strain = diary?.strain_name || 'deine Pflanze';
    setMessages([{
      role: 'assistant',
      content: `🌱 Hey! Ich bin dein **Smart Grow Assistent** für **${strain}** (${stage}).

Ich kenne deinen aktuellen Anbauplan, Umgebungsdaten und die letzten Einträge. Frag mich:

- 🔬 **Probleme diagnostizieren** — Schicke mir ein Foto
- 💡 **Tipps für ${stage}** — Beleuchtung, Nährstoffe, Klima
- 📊 **Anbauplan optimieren** — Individuelle Anpassungen
- ⚡ **Schnelle Hilfe** — pH, EC, VPD, Temperatur

Was kann ich für dich tun?`,
      timestamp: new Date().toISOString(),
    }]);
  }, [diary?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = useMemo(() => [
    { icon: '🔬', text: `Was soll ich in der ${diary?.current_stage || 'Wachstums'}phase beachten?` },
    { icon: '💧', text: 'Ist mein Gieß-Plan optimal?' },
    { icon: '🧪', text: 'Welche Nährstoffe brauche ich jetzt?' },
    { icon: '⚠️', text: 'Meine Blätter zeigen Verfärbungen — was tun?' },
  ], [diary?.current_stage]);

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsLoading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      }
      setUploadedImages(prev => [...prev, ...urls]);
    } catch {
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text = input) => {
    if (!text.trim() && !uploadedImages.length) return;
    if (isLoading) return;

    const userMsg = {
      role: 'user',
      content: text.trim() || '📸 Foto gesendet',
      images: uploadedImages.length ? [...uploadedImages] : undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgUrls = [...uploadedImages];
    setUploadedImages([]);
    setIsLoading(true);

    try {
      // Build conversation history (last 6 messages)
      const history = messages.slice(-6).map(m =>
        `${m.role === 'user' ? 'Nutzer' : 'Assistent'}: ${m.content}`
      ).join('\n\n');

      const prompt = `Du bist der Smart Grow Assistent, ein erfahrener Cannabis-Anbau-Experte. Antworte IMMER auf Deutsch, klar, kompakt und praxisnah. Nutze Markdown für Formatierung. Beziehe dich auf den konkreten Grow-Kontext des Nutzers.

${diaryContext}

GESPRÄCHSVERLAUF:
${history}

Nutzer: ${text.trim() || 'Analysiere mein Foto.'}

Antworte spezifisch für "${diary?.strain_name}" in Phase "${diary?.current_stage}". Wenn Fotos dabei sind, analysiere sie genau.`;

      let response;
      try {
        const res = await base44.functions.invoke('ai/routeCannabisAI', {
          prompt: text.trim() || 'Analysiere mein Foto',
          file_urls: imgUrls,
          context_options: { include_diaries: true, include_knowledge: true },
        });
        if (res?.data?.success) {
          response = res.data.response;
        }
      } catch {}

      // Fallback to direct LLM
      if (!response) {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: imgUrls.length ? imgUrls : undefined,
        });
        response = typeof llmResult === 'string' ? llmResult : JSON.stringify(llmResult);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response || 'Entschuldigung, ich konnte keine Antwort generieren.',
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Verbindungsfehler — bitte versuche es nochmal.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedImages, isLoading, messages, diaryContext, diary]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col" style={{ minHeight: '60vh' }}>
      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-zinc-900/80 border border-zinc-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
              <span className="text-sm text-zinc-500">Denkt nach...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts (only at start) */}
      {messages.length <= 1 && !isLoading && (
        <div className="mb-3">
          <p className="text-[11px] text-zinc-600 mb-2 font-medium">Schnellstart</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-white hover:border-green-500/30 transition-all active:scale-95"
              >
                <span>{p.icon}</span>
                <span className="line-clamp-1">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image previews */}
      {uploadedImages.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {uploadedImages.map((url, i) => (
            <div key={i} className="relative flex-shrink-0">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-zinc-700" />
              <button
                onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all active:scale-90 disabled:opacity-40"
        >
          <Camera className="w-4.5 h-4.5" />
        </button>
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frag den Grow-Assistenten..."
            rows={1}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-green-500/50 transition-colors disabled:opacity-40"
            style={{ maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || (!input.trim() && !uploadedImages.length)}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-black active:scale-90 transition-all disabled:opacity-30 disabled:scale-100"
        >
          {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  );
}