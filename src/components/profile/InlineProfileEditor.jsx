import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ProfilePrivacySettings from './ProfilePrivacySettings';

export default function InlineProfileEditor({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website_url: user.website_url || '',
    grow_level: user.grow_level || 'beginner',
    grow_type: user.grow_type || 'indoor',
    privacy_mode: user.privacy_mode || 'public',
    show_grow_diaries: user.show_grow_diaries || 'public',
    show_activity_status: user.show_activity_status !== false,
  });
  const [activeSection, setActiveSection] = useState('profile');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(user.banner_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setIsUploading(true);
    
    try {
      let updateData = { ...formData };

      // Upload both in parallel
      const [avatarUrl, bannerUrl] = await Promise.all([
        avatarFile ? base44.integrations.Core.UploadFile({ file: avatarFile }) : null,
        bannerFile ? base44.integrations.Core.UploadFile({ file: bannerFile }) : null
      ]);

      if (avatarUrl) updateData.avatar_url = avatarUrl.file_url;
      if (bannerUrl) updateData.banner_url = bannerUrl.file_url;
      
      setIsUploading(false);

      await onSave(updateData);
      
      // Cleanup object URLs
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Profil bearbeiten</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-zinc-800 px-6">
          {[
            { id: 'profile', label: 'Profil' },
            { id: 'privacy', label: 'Privatsphäre' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === tab.id
                  ? 'border-green-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeSection === 'profile' && (
            <>
              {/* Banner */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Banner</label>
                <div className="relative h-32 bg-zinc-800 rounded-xl overflow-hidden group">
                  {bannerPreview && (
                    <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Avatar */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Profilbild</label>
                <div className="relative w-24 h-24 rounded-full overflow-hidden group bg-zinc-800">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-green-500 to-emerald-600">
                      {user.full_name?.[0] || user.email?.[0]}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Name</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Dein Name"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Benutzername</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="benutzername"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Erzähl etwas über dich..."
                  className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                  maxLength={160}
                />
                <p className="text-xs text-zinc-600 mt-1">{formData.bio.length} / 160</p>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Standort</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="z.B. Berlin, Deutschland"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Website</label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Grow Level & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">Erfahrung</label>
                  <Select
                    value={formData.grow_level}
                    onValueChange={(val) => setFormData({ ...formData, grow_level: val })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">🌱 Anfänger</SelectItem>
                      <SelectItem value="intermediate">🧪 Fortgeschritten</SelectItem>
                      <SelectItem value="advanced">🔥 Experte</SelectItem>
                      <SelectItem value="expert">👑 Profi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">Grow-Typ</label>
                  <Select
                    value={formData.grow_type}
                    onValueChange={(val) => setFormData({ ...formData, grow_type: val })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indoor">🏠 Indoor</SelectItem>
                      <SelectItem value="outdoor">🌳 Outdoor</SelectItem>
                      <SelectItem value="both">🔄 Beides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {activeSection === 'privacy' && (
            <ProfilePrivacySettings
              formData={formData}
              onChange={setFormData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-zinc-700"
            disabled={isSaving || isUploading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="bg-[#00FF88] text-black hover:bg-[#00DD77]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Hochladen...
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}