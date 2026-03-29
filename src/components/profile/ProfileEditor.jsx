import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, Save, MapPin, 
  Loader2, Camera, Globe
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProfileEditor({ user, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website_url: user?.website_url || '',
    interests: user?.interests || [],
    grow_level: user?.grow_level || 'beginner'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      toast.success('Profilbild aktualisiert');
      onSave?.();
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await base44.auth.updateMe(formData);
      toast.success('Profil gespeichert');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onClose}
            className="h-9 w-9 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <h2 className="text-lg font-bold text-white">Profil bearbeiten</h2>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving}
            size="sm"
            className="bg-green-500 hover:bg-green-600 rounded-full px-6"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.full_name}</p>
              <p className="text-sm text-zinc-400">@{user?.username || user?.email?.split('@')[0]}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="bg-zinc-800 border-zinc-700"
              placeholder="Dein Name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Benutzername</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="bg-zinc-800 border-zinc-700 pl-8"
                placeholder="benutzername"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Bio
              <span className="text-xs text-zinc-500 ml-2">{formData.bio.length}/280</span>
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="bg-zinc-800 border-zinc-700 min-h-[100px]"
              placeholder="Erzähl etwas über dich..."
              maxLength={280}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Standort</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="bg-zinc-800 border-zinc-700 pl-10"
                placeholder="Berlin, Deutschland"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                className="bg-zinc-800 border-zinc-700 pl-10"
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>

          {/* Grow Level */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Grow-Erfahrung</label>
            <select
              value={formData.grow_level}
              onChange={(e) => setFormData({...formData, grow_level: e.target.value})}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="beginner">🌱 Anfänger</option>
              <option value="intermediate">🌿 Fortgeschritten</option>
              <option value="expert">🌳 Experte</option>
              <option value="master">🏆 Meister</option>
            </select>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}