import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Upload, Video, Music, Sparkles, Check, 
  Play, Pause, RotateCcw, ChevronRight, Loader2,
  Hash, AlignLeft, Eye, Globe
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const MUSIC_TRACKS = [
  { id: 'none', name: 'Kein Sound', artist: '', emoji: '🔇' },
  { id: 'chill1', name: 'Chill Vibes', artist: 'GrowHub Beats', emoji: '🌿' },
  { id: 'upbeat1', name: 'Growing Strong', artist: 'GrowHub Beats', emoji: '💪' },
  { id: 'nature1', name: 'Nature Sounds', artist: 'Ambient', emoji: '🌱' },
  { id: 'lofi1', name: 'Lo-Fi Garden', artist: 'GrowHub Beats', emoji: '🎵' },
];

const EFFECTS = [
  { id: 'none', name: 'Original', emoji: '📷' },
  { id: 'green', name: 'GreenFilter', emoji: '🌿' },
  { id: 'warm', name: 'Warm', emoji: '🌅' },
  { id: 'cool', name: 'Cool', emoji: '❄️' },
  { id: 'vintage', name: 'Vintage', emoji: '📼' },
  { id: 'neon', name: 'Neon', emoji: '✨' },
];

const STEPS = ['upload', 'edit', 'publish'];

export default function CreateReelModal({ isOpen, onClose, currentUser, onPublished }) {
  const [step, setStep] = useState('upload');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Bitte wähle eine Videodatei aus');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video darf maximal 100MB groß sein');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setStep('edit');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const togglePreviewPlay = () => {
    const video = videoPreviewRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetVideo = () => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = 0;
      videoPreviewRef.current.pause();
    }
    setIsPlaying(false);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setStep('upload');
  };

  const handlePublish = async () => {
    if (!videoFile || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 85));
      }, 400);

      const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
      clearInterval(progressInterval);
      setUploadProgress(90);

      const parsedTags = tags
        .split(/[\s,#]+/)
        .map(t => t.replace('#', '').trim())
        .filter(Boolean);

      const postData = {
        content: caption,
        type: 'video',
        post_type: 'general',
        media_urls: [file_url],
        tags: parsedTags,
        visibility,
        status: 'published',
        moderation_status: 'pending',
        view_count: 0,
        share_count: 0,
        reactions: {
          like: { count: 0, users: [] },
          fire: { count: 0, users: [] },
          laugh: { count: 0, users: [] },
          mind_blown: { count: 0, users: [] },
          celebrate: { count: 0, users: [] },
        },
        bookmarked_by_users: [],
        comments_count: 0,
      };

      await base44.entities.Post.create(postData);
      setUploadProgress(100);

      toast.success('🎬 Reel veröffentlicht!');
      onPublished?.();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Veröffentlichen');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setStep('upload');
    setCaption('');
    setTags('');
    setSelectedMusic('none');
    setSelectedEffect('none');
    setIsPlaying(false);
    onClose();
  };

  const effectFilter = {
    none: '',
    green: 'hue-rotate(90deg) saturate(1.5)',
    warm: 'sepia(0.4) saturate(1.3) brightness(1.05)',
    cool: 'hue-rotate(200deg) saturate(0.9) brightness(1.05)',
    vintage: 'sepia(0.6) contrast(1.1) brightness(0.95)',
    neon: 'saturate(2) contrast(1.2) brightness(1.1)',
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-end sm:items-center justify-center"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {step !== 'upload' && (
              <button
                onClick={() => setStep(step === 'publish' ? 'edit' : 'upload')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>
            )}
            <h2 className="text-white font-bold text-lg">
              {step === 'upload' && 'Reel erstellen'}
              {step === 'edit' && 'Bearbeiten'}
              {step === 'publish' && 'Veröffentlichen'}
            </h2>
          </div>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 py-3">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-0.5 rounded-full transition-colors ${
                STEPS.indexOf(step) >= i ? 'bg-green-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="p-5">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-white font-semibold mb-1">Video hochladen</p>
                <p className="text-zinc-500 text-sm mb-4">MP4, MOV, WEBM bis 100MB</p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-black rounded-xl font-semibold text-sm">
                  <Upload className="w-4 h-4" />
                  Datei auswählen
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files[0])}
              />

              <p className="text-center text-zinc-600 text-xs mt-4">
                Ziehe dein Video hierher oder klicke zum Auswählen
              </p>
            </div>
          )}

          {/* Step 2: Edit */}
          {step === 'edit' && videoPreviewUrl && (
            <div className="p-5 space-y-5">
              {/* Video preview */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[9/16] max-h-64 mx-auto w-36">
                <video
                  ref={videoPreviewRef}
                  src={videoPreviewUrl}
                  className="w-full h-full object-cover"
                  style={{ filter: effectFilter[selectedEffect] }}
                  loop
                  playsInline
                  muted
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePreviewPlay}
                    className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                  </button>
                </div>
                <button
                  onClick={resetVideo}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Effects */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium text-sm">Filter & Effekte</span>
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {EFFECTS.map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => setSelectedEffect(effect.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                        selectedEffect === effect.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{effect.emoji}</span>
                      <span className="text-white/80 text-xs">{effect.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Music */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">Musik hinzufügen</span>
                </div>
                <div className="space-y-2">
                  {MUSIC_TRACKS.map(track => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedMusic(track.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                        selectedMusic === track.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{track.emoji}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{track.name}</p>
                        {track.artist && <p className="text-zinc-500 text-xs">{track.artist}</p>}
                      </div>
                      {selectedMusic === track.id && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Publish */}
          {step === 'publish' && (
            <div className="p-5 space-y-4">
              {/* Mini preview */}
              {videoPreviewUrl && (
                <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video">
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-cover"
                    style={{ filter: effectFilter[selectedEffect] }}
                    muted
                    playsInline
                  />
                  {selectedMusic !== 'none' && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
                      <Music className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{MUSIC_TRACKS.find(t => t.id === selectedMusic)?.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Caption */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft className="w-4 h-4 text-zinc-400" />
                  <label className="text-white text-sm font-medium">Beschreibung</label>
                </div>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Schreibe etwas über dein Video..."
                  maxLength={500}
                  rows={3}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-green-500 resize-none"
                />
                <p className="text-right text-zinc-600 text-xs mt-1">{caption.length}/500</p>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-zinc-400" />
                  <label className="text-white text-sm font-medium">Hashtags</label>
                </div>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="#grow #cannabis #indoor"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Visibility */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <label className="text-white text-sm font-medium">Sichtbarkeit</label>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'public', label: 'Öffentlich', icon: '🌍' },
                    { id: 'friends', label: 'Freunde', icon: '👥' },
                    { id: 'private', label: 'Nur ich', icon: '🔒' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setVisibility(opt.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-all ${
                        visibility === opt.id
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="bg-zinc-900 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                    <span className="text-white text-sm">Wird hochgeladen...</span>
                    <span className="ml-auto text-green-400 text-sm font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-white/5">
          {step === 'edit' && (
            <button
              onClick={() => setStep('publish')}
              className="w-full py-3.5 bg-green-500 text-black rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 'publish' && (
            <button
              onClick={handlePublish}
              disabled={isUploading}
              className="w-full py-3.5 bg-green-500 text-black rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird veröffentlicht...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Reel veröffentlichen
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}