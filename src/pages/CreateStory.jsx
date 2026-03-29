import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  X, Camera, Image, Type,
  ChevronLeft, Send, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const STICKERS = ['🌿', '🔥', '💨', '🌱', '🍃', '⭐', '❤️', '😎', '🎉', '💯', '🏆', '🌈'];

const TEXT_STYLES = [
  { id: 'normal', label: 'Normal', class: 'text-white' },
  { id: 'neon', label: 'Neon', class: 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]' },
  { id: 'bold', label: 'Fett', class: 'text-white font-black text-4xl' },
  { id: 'outline', label: 'Outline', class: 'text-transparent [-webkit-text-stroke:2px_white]' }
];

export default function CreateStory() {
  const [currentUser, setCurrentUser] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [textOverlay, setTextOverlay] = useState('');
  const [textStyle, setTextStyle] = useState('normal');
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState('select'); // select, edit, preview
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch {
      toast.error('Bitte melde dich an');
      navigate(createPageUrl('Feed'));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Nur Bilder und Videos erlaubt');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Datei zu groß (max 100MB)');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setStep('edit');
  };

  const handleAddSticker = (sticker) => {
    setSelectedStickers(prev => [...prev, {
      id: Date.now(),
      emoji: sticker,
      x: 50,
      y: 50
    }]);
  };

  const handlePublish = async () => {
    if (!mediaFile || !currentUser) {
      toast.error('Wähle zuerst ein Bild oder Video');
      return;
    }

    setIsUploading(true);
    try {
      // Upload media
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });

      // Calculate expiry (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create story
      await base44.entities.Story.create({
        media_url: file_url,
        media_type: mediaType,
        text_overlay: textOverlay || null,
        duration_seconds: mediaType === 'image' ? 5 : 15,
        expires_at: expiresAt.toISOString(),
        views: [],
        replies: []
      });

      toast.success('Story veröffentlicht!');
      navigate(createPageUrl('Feed'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => {
            if (step === 'edit') setStep('select');
            else navigate(-1);
          }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          {step === 'select' ? <X className="w-6 h-6 text-white" /> : <ChevronLeft className="w-6 h-6 text-white" />}
        </button>
        
        <h1 className="text-white font-bold text-lg">Story erstellen</h1>
        
        <div className="w-10" />
      </div>

      {/* Content */}
      {step === 'select' && (
        <div className="h-full flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm space-y-4"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-3xl border-2 border-dashed border-green-500/50 hover:border-green-500 transition-all"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <Image className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-white font-bold text-lg mb-1">Foto oder Video</p>
              <p className="text-zinc-400 text-sm">Aus deiner Galerie auswählen</p>
            </button>

            <button
              onClick={() => toast.info('Kamera kommt bald!')}
              className="w-full p-6 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold">Kamera öffnen</p>
                <p className="text-zinc-400 text-sm">Direkt aufnehmen</p>
              </div>
            </button>

            <button
              onClick={() => {
                setTextOverlay('');
                setMediaPreview(null);
                setStep('edit');
              }}
              className="w-full p-6 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Type className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold">Text-Story</p>
                <p className="text-zinc-400 text-sm">Nur mit Text</p>
              </div>
            </button>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {step === 'edit' && (
        <div className="h-full flex flex-col">
          {/* Preview */}
          <div className="flex-1 relative">
            {mediaPreview ? (
              mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500" />
            )}

            {/* Text Overlay */}
            {textOverlay && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p className={`text-2xl font-bold text-center ${TEXT_STYLES.find(s => s.id === textStyle)?.class}`}>
                  {textOverlay}
                </p>
              </div>
            )}

            {/* Stickers */}
            {selectedStickers.map(sticker => (
              <motion.div
                key={sticker.id}
                drag
                dragMomentum={false}
                className="absolute text-5xl cursor-move"
                style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {sticker.emoji}
              </motion.div>
            ))}
          </div>

          {/* Tools */}
          <div className="absolute bottom-24 left-0 right-0 px-4">
            <div className="flex gap-3 justify-center mb-4">
              {STICKERS.slice(0, 6).map(sticker => (
                <button
                  key={sticker}
                  onClick={() => handleAddSticker(sticker)}
                  className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                >
                  {sticker}
                </button>
              ))}
            </div>

            <Input
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Text hinzufügen..."
              className="bg-black/50 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 text-center"
            />

            <div className="flex gap-2 justify-center mt-3">
              {TEXT_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setTextStyle(style.id)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    textStyle === style.id 
                      ? 'bg-white text-black' 
                      : 'bg-black/50 text-white'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Publish Button */}
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              onClick={handlePublish}
              disabled={isUploading || (!mediaFile && !textOverlay)}
              className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg font-bold rounded-2xl"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Story teilen
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}