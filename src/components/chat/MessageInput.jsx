import React, { useState, useRef } from 'react';
import { Send, Smile, Mic, X, Image as ImageIcon } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import StickerPicker from './StickerPicker';
import { toast } from 'sonner';

export default function MessageInput({ onSend, onTyping, disabled = false }) {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (mediaPreview?.url) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
  }, [mediaPreview?.url]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed && !mediaPreview) return;

    if (mediaPreview) {
      handleSendMedia();
    } else {
      onSend(trimmed, 'text');
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei zu groß (max 10MB)');
      return;
    }

    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('video/') ? 'video' : 'text';

    // Revoke old preview if exists
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url);
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type, file });
    e.target.value = '';
  };

  const handleSendMedia = () => {
    if (!mediaPreview) return;

    const mediaData = {
      blob: mediaPreview.file,
      name: mediaPreview.file.name,
      size: mediaPreview.file.size,
      type: mediaPreview.type
    };

    const defaultMessage = mediaPreview.type === 'image' ? '📷 Foto' : '🎬 Video';
    onSend(message.trim() || defaultMessage, mediaPreview.type, mediaData);
    setMessage('');
    URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleVoiceSend = (audioBlob, duration) => {
    const mediaData = {
      blob: audioBlob,
      name: 'voice-message.webm',
      size: audioBlob.size,
      type: 'voice',
      duration
    };
    onSend('', 'voice', mediaData);
    setIsRecording(false);
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = message.slice(0, start) + emoji + message.slice(end);
    setMessage(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div className="relative border-t border-zinc-800 bg-zinc-950 z-10 pb-[env(safe-area-inset-bottom)]">
      {/* Media Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <div className="p-4 border-b border-zinc-800">
            <div className="relative inline-block">
              {mediaPreview.type === 'image' ? (
                <img
                  src={mediaPreview.url}
                  alt="Preview"
                  className="max-w-xs max-h-40 rounded-lg"
                />
              ) : (
                <video
                  src={mediaPreview.url}
                  className="max-w-xs max-h-40 rounded-lg"
                  controls
                />
              )}
              <button
                onClick={() => {
                  URL.revokeObjectURL(mediaPreview.url);
                  setMediaPreview(null);
                }}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Voice Recorder */}
      <AnimatePresence>
        {isRecording && (
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setIsRecording(false)}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      {!isRecording && (
        <div className="flex items-end gap-2 p-3">
          <div className="flex-1 relative flex items-center bg-zinc-900/95 rounded-3xl px-4 py-3 min-h-[52px] border border-zinc-700/80 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            <button
              onClick={() => {
                setShowEmoji(!showEmoji);
                setShowStickers(false);
              }}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0"
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>

            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                if (onTyping) onTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht..."
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent text-white text-base placeholder-gray-500 resize-none max-h-[100px] focus:outline-none px-3"
              style={{ minHeight: '28px', lineHeight: '1.4' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0"
              disabled={disabled}
            >
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence>
              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                  position="top"
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showStickers && (
                <StickerPicker
                  onSelect={(sticker) => onSend(sticker, 'sticker')}
                  onClose={() => setShowStickers(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {message.trim() || mediaPreview ? (
            <button
              onClick={mediaPreview ? handleSendMedia : handleSend}
              disabled={disabled}
              className="p-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full transition-all shadow-lg shadow-green-900/30 disabled:opacity-50 flex-shrink-0 active:scale-95"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => setIsRecording(true)}
              disabled={disabled}
              className="p-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all flex-shrink-0 active:scale-95"
            >
              <Mic className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}