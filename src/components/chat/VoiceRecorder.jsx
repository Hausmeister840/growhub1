import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onSend(blob, duration);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-0 bottom-0 bg-zinc-950 border-t border-zinc-800 p-4"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-red-400" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
          )}
          <span className="text-white font-mono text-lg">
            {formatTime(duration)}
          </span>
          {audioURL && (
            <audio src={audioURL} controls className="flex-1" />
          )}
        </div>

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-full transition-colors"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-sm" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="p-3 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}