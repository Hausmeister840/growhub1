import { useState } from 'react';
import { Wand2, Image, FileText, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIContentGenerator({ onContentGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentType, setContentType] = useState('text');
  const [prompt, setPrompt] = useState('');

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Bitte gib einen Prompt ein');
      return;
    }

    setIsGenerating(true);
    try {
      if (contentType === 'image') {
        const response = await base44.integrations.Core.GenerateImage({
          prompt: prompt
        });
        onContentGenerated({ type: 'image', url: response.url });
        toast.success('Bild generiert!');
      } else if (contentType === 'text') {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Schreibe einen ansprechenden Social-Media-Post über: ${prompt}. 
          Mache ihn interessant, authentisch und im GrowHub-Stil. Max 280 Zeichen.`
        });
        onContentGenerated({ type: 'text', content: response });
        toast.success('Text generiert!');
      }
    } catch (error) {
      toast.error('Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
          <Wand2 className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white">AI Content Generator</h3>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'text', icon: FileText, label: 'Text' },
          { id: 'image', icon: Image, label: 'Bild' }
        ].map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${
                contentType === type.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Beschreibe was du erstellen möchtest..."
        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
      />

      <button
        onClick={generateContent}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/30"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generiere...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generieren
          </>
        )}
      </button>
    </div>
  );
}