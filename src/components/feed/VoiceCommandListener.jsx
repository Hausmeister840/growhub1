import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceCommandListener() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Voice commands not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'de-DE';

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setTranscript(command);
      
      // Process commands
      if (command.includes('aktualisieren') || command.includes('neu laden') || command.includes('refresh')) {
        window.location.reload();
        toast.success('Feed wird aktualisiert');
      } else if (command.includes('post erstellen') || command.includes('neuer post')) {
        window.dispatchEvent(new Event('openCreatePost'));
        toast.success('Post-Editor öffnet...');
      } else if (command.includes('suchen') || command.includes('suche')) {
        window.dispatchEvent(new CustomEvent('openSearch'));
        toast.info('Suche öffnen');
      } else if (command.includes('trending') || command.includes('angesagt')) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'trending' }));
        toast.success('Trending Feed aktiviert');
      } else if (command.includes('following') || command.includes('folge')) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'following' }));
        toast.success('Following Feed aktiviert');
      } else if (command.includes('ai feed')) {
        window.dispatchEvent(new CustomEvent('switchTab', { detail: 'ai' }));
        toast.success('AI Feed aktiviert');
      } else {
        toast.info(`Befehl: "${command}" - Verarbeite...`);
      }
      
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Listen for voice activation (long press on Mic button)
    const handleKeyDown = (e) => {
      if (e.key === 'v' && e.ctrlKey) {
        e.preventDefault();
        if (!isListening) {
          recognition.start();
          setIsListening(true);
          toast.info('Sprechen Sie jetzt...');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      recognition.stop();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListening]);

  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 right-6 z-50 bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-3xl shadow-2xl shadow-purple-500/50"
        >
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Mic className="w-8 h-8 text-white" />
            </motion.div>
            <p className="text-white text-sm font-medium">Sprechen Sie...</p>
            {transcript && (
              <p className="text-white/70 text-xs">{transcript}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}