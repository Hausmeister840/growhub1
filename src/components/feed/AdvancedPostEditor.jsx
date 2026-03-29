import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Link as LinkIcon, Mic, Sparkles
} from 'lucide-react';
import { InvokeLLM, UploadFile } from '@/integrations/Core';

export default function AdvancedPostEditor({ 
  value, 
  onChange, 
  onMediaUpload, 
  placeholder = "Was möchtest du teilen?",
  maxLength = 5000 
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const textareaRef = useRef(null);
  const mediaRecorder = useRef(null);

  const insertFormatting = (format) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    switch (format) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        break;
      case 'link':
        const url = prompt('URL eingeben:');
        if (url) {
          newText = value.substring(0, start) + `[${selectedText || 'Link'}](${url})` + value.substring(end);
        }
        break;
      default:
        return;
    }
    
    onChange(newText);
    setTimeout(() => textarea.focus(), 0);
  };

  const generateAISuggestions = async () => {
    if (!value.trim()) return;
    
    setIsGeneratingAI(true);
    try {
      const response = await InvokeLLM({
        prompt: `Basierend auf diesem Post-Anfang: "${value}", generiere 3 hilfreiche Vervollständigungen oder Verbesserungsvorschläge für einen Cannabis-Growing-Post. Halte den Ton freundlich und informativ.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  type: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });
      
      setAiSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('AI suggestion failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], 'voice-note.wav', { type: 'audio/wav' });
        
        try {
          const { file_url } = await UploadFile({ file });
          // Here you would integrate with a speech-to-text service
          // For now, we'll just indicate that voice was recorded
          onChange(value + ' [🎤 Sprachnachricht aufgenommen]');
        } catch (error) {
          console.error('Voice upload failed:', error);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + emoji + value.substring(start);
    onChange(newText);
    setTimeout(() => textarea.focus(), 0);
  };

  const quickEmojis = ['🌱', '🍃', '💚', '✨', '🔥', '👌', '💪', '🎯', '📸', '💡'];

  return (
    <div className="space-y-4">
      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {aiSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onChange(suggestion.text)}
              className="text-xs border-green-500/30 hover:bg-green-500/10"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              KI-Vorschlag
            </Button>
          ))}
        </motion.div>
      )}

      {/* Main Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full min-h-[120px] bg-transparent border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-400 resize-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
          onFocus={() => setShowFormatting(true)}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs text-zinc-400">
          {value.length}/{maxLength}
        </div>
      </div>

      {/* Formatting Toolbar */}
      {showFormatting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-3 bg-zinc-800/50 rounded-lg"
        >
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => insertFormatting('bold')}
              className="w-8 h-8 text-zinc-400 hover:text-white"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => insertFormatting('italic')}
              className="w-8 h-8 text-zinc-400 hover:text-white"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => insertFormatting('link')}
              className="w-8 h-8 text-zinc-400 hover:text-white"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-zinc-600" />

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`w-8 h-8 ${isRecording ? 'text-red-400 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={generateAISuggestions}
              disabled={isGeneratingAI || !value.trim()}
              className="w-8 h-8 text-zinc-400 hover:text-green-400"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="w-px h-6 bg-zinc-600" />

          {/* Quick Emojis */}
          <div className="flex gap-1">
            {quickEmojis.map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                onClick={() => insertEmoji(emoji)}
                className="w-8 h-8 text-lg hover:bg-zinc-700"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}