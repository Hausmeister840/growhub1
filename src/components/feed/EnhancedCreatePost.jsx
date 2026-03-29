import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import OptimizedButton from '../ui/OptimizedButton';

export default function EnhancedCreatePost({ isOpen, onClose, onPostCreated, currentUser }) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleMediaSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 10) {
      toast.error('Maximal 10 Medien pro Post');
      return;
    }
    setMediaFiles(prev => [...prev, ...files]);
  }, [mediaFiles.length]);

  const handleRemoveMedia = useCallback((index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Post braucht Inhalt oder Medien');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let mediaUrls = [];
      
      if (mediaFiles.length > 0) {
        const totalFiles = mediaFiles.length;
        
        for (let i = 0; i < totalFiles; i++) {
          const file = mediaFiles[i];
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          mediaUrls.push(file_url);
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
      }

      await base44.entities.Post.create({
        content: content.trim(),
        media_urls: mediaUrls,
        type: mediaUrls.length > 0 ? 'image' : 'text',
        status: 'published'
      });

      toast.success('Post erstellt! 🎉');
      onPostCreated?.();
      setContent('');
      setMediaFiles([]);
      onClose();

    } catch (error) {
      console.error('Post creation error:', error);
      toast.error('Post konnte nicht erstellt werden');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-zinc-950/95 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Neuer Post</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Was gibt's Neues?"
              className="w-full min-h-[150px] bg-transparent text-white text-lg placeholder:text-zinc-600 focus:outline-none resize-none"
              autoFocus
            />

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-900">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Hochladen...</span>
                  <span className="text-[#00FF88] font-bold">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2.5 text-zinc-400 hover:text-[#00FF88] hover:bg-zinc-900 rounded-full transition-colors disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            <OptimizedButton
              onClick={handleSubmit}
              disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Wird gepostet...' : 'Posten'}
            </OptimizedButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}