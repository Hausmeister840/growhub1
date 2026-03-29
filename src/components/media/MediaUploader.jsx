import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Video, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;

// Image compression
async function compressImage(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function MediaUploader({ 
  onFilesSelected, 
  onUploadComplete, 
  maxFiles = MAX_FILES,
  accept = 'image/*,video/*',
  showPreview = true
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximal ${maxFiles} Dateien erlaubt`);
      return;
    }

    const validFiles = [];

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} ist zu groß (max 100MB)`);
        continue;
      }

      // Compress images
      if (file.type.startsWith('image/')) {
        try {
          toast.info(`${file.name} wird komprimiert...`);
          const compressed = await compressImage(file);
          const reduction = ((1 - compressed.size / file.size) * 100).toFixed(0);
          console.log(`✅ Compressed ${file.name}: ${reduction}% smaller`);
          validFiles.push(compressed);
        } catch (error) {
          console.error('Compression error:', error);
          validFiles.push(file);
        }
      } else {
        validFiles.push(file);
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    onFilesSelected?.(validFiles);

    // Reset input
    e.target.value = '';
  }, [files, maxFiles, onFilesSelected]);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading({});
    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        setUploading(prev => ({ ...prev, [i]: true }));
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));

        // Simulate progress (Base44 doesn't provide real progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [i]: Math.min((prev[i] || 0) + 10, 90)
          }));
        }, 200);

        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        
        urls.push(file_url);
        
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        toast.error(`Upload fehlgeschlagen: ${file.name}`);
        setUploadProgress(prev => ({ ...prev, [i]: -1 })); // Error state
      } finally {
        setUploading(prev => ({ ...prev, [i]: false }));
      }
    }

    onUploadComplete?.(urls);
    toast.success(`${urls.length} Datei(en) hochgeladen!`);
    setFiles([]);
    setUploadProgress({});
  }, [files, onUploadComplete]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full border-dashed border-2 border-zinc-700 hover:border-green-500 h-32 flex flex-col items-center justify-center gap-2"
        >
          <Upload className="w-8 h-8 text-zinc-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">Medien hochladen</p>
            <p className="text-xs text-zinc-500 mt-1">
              Bilder oder Videos (max {maxFiles} Dateien)
            </p>
          </div>
        </Button>
      </div>

      {/* Preview & Upload */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Files List */}
            <div className="space-y-2">
              {files.map((file, index) => {
                const isVideo = file.type.startsWith('video/');
                const isUploading = uploading[index];
                const progress = uploadProgress[index] || 0;
                const hasError = progress === -1;
                const isComplete = progress === 100;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800"
                  >
                    {/* Preview */}
                    {showPreview && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        {isVideo ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-zinc-500" />
                          </div>
                        ) : (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Progress Bar */}
                      {isUploading && (
                        <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {isComplete ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : hasError ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : isUploading ? (
                        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                      ) : (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-zinc-400" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={Object.values(uploading).some(Boolean)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {Object.values(uploading).some(Boolean) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Hochladen... ({Object.values(uploading).filter(Boolean).length}/{files.length})
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {files.length} Datei(en) hochladen
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}