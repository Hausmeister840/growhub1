
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  X, Camera, Link as LinkIcon, MapPin, Globe,
  User, Save, Loader2,
  Image as ImageIcon, Trash2, Plus, AlertCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { User as UserEntity } from '@/entities/User';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; // Added Badge import

const GROW_LEVELS = [
  { value: 'beginner', label: 'Anfänger', emoji: '🌱', description: 'Ich starte gerade erst' },
  { value: 'intermediate', label: 'Fortgeschritten', emoji: '🌿', description: 'Ich habe Erfahrung' },
  { value: 'expert', label: 'Experte', emoji: '🌳', description: 'Ich kenne mich aus' },
  { value: 'master', label: 'Meister', emoji: '👑', description: 'Ich bin ein Profi' }
];

const PRIVACY_MODES = [
  { value: 'public', label: 'Öffentlich', description: 'Jeder kann dein Profil sehen' },
  { value: 'followers', label: 'Nur Follower', description: 'Nur deine Follower sehen dein Profil' },
  { value: 'private', label: 'Privat', description: 'Nur du siehst dein Profil' }
];

const INTERESTS = [
  'Indoor Growing', 'Outdoor Growing', 'Hydroponics', 'Organic Growing',
  'LED Technology', 'Strain Breeding', 'Medical Cannabis', 'CBD',
  'Edibles', 'Concentrates', 'Growing Tips', 'Equipment Reviews'
];

export default function CompleteProfileEditor({ user, isOpen, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState(false); // New state for portfolio image uploads
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    username: user?.username || '',
    handle: user?.handle || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '', // Changed from website_url
    avatar_url: user?.avatar_url || '',
    banner_url: user?.banner_url || '',
    grow_level: user?.grow_level || 'beginner',
    privacy_mode: user?.privacy_mode || 'public',
    interests: user?.interests || [],
    links: user?.links || [],
    social_links: user?.social_links || {}, // New field
    projects: user?.projects || [], // New field
    portfolio: user?.portfolio || [], // New field
    preferences: user?.preferences || {
      language: 'de',
      show_online_status: true,
      allow_profile_views: true,
      categories: []
    }
  });

  const [newLink, setNewLink] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username?.trim()) {
      newErrors.username = 'Username ist erforderlich';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username muss mindestens 3 Zeichen lang sein';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username darf nur Buchstaben, Zahlen und Unterstriche enthalten';
    }

    if (formData.bio && formData.bio.length > 280) {
      newErrors.bio = 'Bio darf maximal 280 Zeichen lang sein';
    }

    if (formData.website && !isValidUrl(formData.website)) { // Changed website_url to website
      newErrors.website = 'Ungültige URL'; // Changed website_url to website
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePreferenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei zu groß', { description: 'Maximale Größe: 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Ungültiger Dateityp', { description: 'Bitte wähle ein Bild' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('avatar_url', file_url);
      toast.success('Avatar hochgeladen!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Upload fehlgeschlagen', { description: error.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei zu groß', { description: 'Maximale Größe: 10MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Ungültiger Dateityp', { description: 'Bitte wähle ein Bild' });
      return;
    }

    setUploadingBanner(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('banner_url', file_url);
      toast.success('Banner hochgeladen!');
    } catch (error) {
      console.error('Banner upload error:', error);
      toast.error('Upload fehlgeschlagen', { description: error.message });
    } finally {
      setUploadingBanner(false);
    }
  };

  const toggleInterest = (interest) => {
    const currentInterests = formData.interests || [];
    if (currentInterests.includes(interest)) {
      handleChange('interests', currentInterests.filter(i => i !== interest));
    } else {
      handleChange('interests', [...currentInterests, interest]);
    }
  };

  const addLink = () => {
    if (!newLink.trim()) return;

    if (!isValidUrl(newLink.trim())) {
      toast.error('Ungültige URL');
      return;
    }

    handleChange('links', [...(formData.links || []), newLink.trim()]);
    setNewLink('');
  };

  const removeLink = (index) => {
    handleChange('links', formData.links.filter((_, i) => i !== index));
  };

  // ✅ PROJECT HANDLERS
  const handleAddProject = () => {
    const newProject = {
      id: Date.now().toString(),
      title: '',
      description: '',
      technologies: [],
      link: '',
      image_url: '',
      created_date: new Date().toISOString()
    };
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const handleUpdateProject = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleRemoveProject = (id) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  const handleAddTechnology = (projectId, tech) => {
    if (!tech.trim()) return;
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, technologies: [...p.technologies, tech.trim()] } : p
      )
    }));
  };

  const handleRemoveTechnology = (projectId, techIndex) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? {
          ...p,
          technologies: p.technologies.filter((_, i) => i !== techIndex)
        } : p
      )
    }));
  };

  // ✅ PORTFOLIO HANDLERS
  const handleAddPortfolioItem = () => {
    const newItem = {
      id: Date.now().toString(),
      title: '',
      type: 'image',
      url: '',
      thumbnail_url: '',
      description: '',
      created_date: new Date().toISOString()
    };
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, newItem]
    }));
  };

  const handleUpdatePortfolioItem = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemovePortfolioItem = (id) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(item => item.id !== id)
    }));
  };

  const handleUploadPortfolioImage = async (itemId, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei zu groß', { description: 'Maximale Größe: 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Ungültiger Dateityp', { description: 'Bitte wähle ein Bild' });
      return;
    }

    setUploadingPortfolioImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleUpdatePortfolioItem(itemId, 'url', file_url);
      handleUpdatePortfolioItem(itemId, 'thumbnail_url', file_url);
      toast.success('Bild hochgeladen!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploadingPortfolioImage(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Bitte behebe alle Fehler');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        username: formData.username.trim(),
        handle: formData.handle?.trim() || `@${formData.username.trim()}`,
        bio: formData.bio?.trim() || '',
        location: formData.location?.trim() || '',
        website: formData.website?.trim() || '', // Changed from website_url
        avatar_url: formData.avatar_url || '',
        banner_url: formData.banner_url || '',
        grow_level: formData.grow_level,
        privacy_mode: formData.privacy_mode,
        interests: formData.interests,
        links: formData.links,
        social_links: formData.social_links, // New
        projects: formData.projects, // New
        portfolio: formData.portfolio, // New
        preferences: formData.preferences
      };

      await UserEntity.update(user.id, updateData);
      toast.success('Profil gespeichert! ✅');
      onSave?.(updateData);
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Fehler beim Speichern', {
        description: error.message || 'Bitte versuche es erneut'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
              <div>
                <h2 className="text-2xl font-bold text-white">Profil bearbeiten</h2>
                <p className="text-sm text-zinc-400 mt-1">Passe dein Profil nach deinen Wünschen an</p>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white rounded-full"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Banner & Avatar */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Profilbilder</label>

                {/* Banner */}
                <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-zinc-800 group">
                  {formData.banner_url ? (
                    <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    id="banner-upload"
                    disabled={uploadingBanner || isSaving}
                  />
                  <label
                    htmlFor="banner-upload"
                    className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${
                      uploadingBanner || isSaving ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {uploadingBanner ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                        <p className="text-sm text-white font-semibold">Banner ändern</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-4 border-zinc-900 group">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <User className="w-10 h-10" />
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={uploadingAvatar || isSaving}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${
                          uploadingAvatar || isSaving ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-1">Profilbild</p>
                    <p className="text-xs text-zinc-400">PNG, JPG bis zu 5MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Grundlegende Informationen</label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Username *</label>
                    <Input
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="deinusername"
                      className={`bg-zinc-900/50 border-zinc-800 ${errors.username ? 'border-red-500' : ''}`}
                      disabled={isSaving}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Handle</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
                      <Input
                        value={formData.handle}
                        onChange={(e) => handleChange('handle', e.target.value)}
                        placeholder="handle"
                        className="bg-zinc-900/50 border-zinc-800 pl-8"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Erzähl etwas über dich..."
                    maxLength={280}
                    className={`bg-zinc-900/50 border-zinc-800 min-h-[100px] ${errors.bio ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      {errors.bio && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.bio}
                        </p>
                      )}
                    </div>
                    <p className={`text-xs ${
                      (formData.bio?.length || 0) > 280 ? 'text-red-500' : 'text-zinc-500'
                    } text-right`}>
                      {formData.bio?.length || 0} / 280
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Standort
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="z.B. Berlin, Deutschland"
                      className="bg-zinc-900/50 border-zinc-800"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </label>
                    <Input
                      value={formData.website} // Changed from website_url
                      onChange={(e) => handleChange('website', e.target.value)} // Changed from website_url
                      placeholder="https://..."
                      className={`bg-zinc-900/50 border-zinc-800 ${errors.website ? 'border-red-500' : ''}`} // Changed from website_url
                      disabled={isSaving}
                    />
                    {errors.website && ( // Changed from website_url
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grow Level */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Grow Experience</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GROW_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => handleChange('grow_level', level.value)}
                      disabled={isSaving}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.grow_level === level.value
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-3xl mb-2">{level.emoji}</div>
                      <p className="text-sm font-semibold text-white">{level.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Interessen</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const isSelected = formData.interests?.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Zusätzliche Links</label>

                <div className="flex gap-2">
                  <Input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://..."
                    onKeyPress={(e) => e.key === 'Enter' && addLink()}
                    className="flex-1 bg-zinc-900/50 border-zinc-800"
                    disabled={isSaving}
                  />
                  <Button
                    onClick={addLink}
                    size="icon"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={isSaving || !newLink.trim()}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                {formData.links && formData.links.length > 0 && (
                  <div className="space-y-2">
                    {formData.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                        <LinkIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        <span className="text-sm text-zinc-300 flex-1 truncate">{link}</span>
                        <Button
                          onClick={() => removeLink(index)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          disabled={isSaving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ PROJECTS SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Projekte</label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddProject}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSaving}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Projekt hinzufügen
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.projects.map((project, index) => (
                    <div key={project.id} className="bg-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Projekt {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveProject(project.id)}
                          className="text-red-500 hover:text-red-400"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Projekt-Titel"
                        value={project.title}
                        onChange={(e) => handleUpdateProject(project.id, 'title', e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                        disabled={isSaving}
                      />

                      <Textarea
                        placeholder="Beschreibung..."
                        value={project.description}
                        onChange={(e) => handleUpdateProject(project.id, 'description', e.target.value)}
                        className="bg-zinc-900 border-zinc-700 h-20"
                        disabled={isSaving}
                      />

                      <Input
                        placeholder="Projekt-Link (optional)"
                        value={project.link}
                        onChange={(e) => handleUpdateProject(project.id, 'link', e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                        disabled={isSaving}
                      />

                      <Input
                        placeholder="Bild-URL (optional)"
                        value={project.image_url}
                        onChange={(e) => handleUpdateProject(project.id, 'image_url', e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                        disabled={isSaving}
                      />

                      <div>
                        <label className="text-xs text-zinc-500 mb-2 block">Technologien</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {project.technologies.map((tech, i) => (
                            <Badge key={i} variant="secondary" className="bg-zinc-700 text-white">
                              {tech}
                              <button
                                type="button"
                                onClick={() => handleRemoveTechnology(project.id, i)}
                                className="ml-1 hover:text-red-400 focus:outline-none"
                                disabled={isSaving}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Input
                          placeholder="Technologie hinzufügen (Enter drücken)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTechnology(project.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-zinc-900 border-zinc-700"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ✅ PORTFOLIO SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Portfolio</label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPortfolioItem}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSaving}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Eintrag hinzufügen
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.portfolio.map((item, index) => (
                    <div key={item.id} className="bg-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Portfolio {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemovePortfolioItem(item.id)}
                          className="text-red-500 hover:text-red-400"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Titel"
                        value={item.title}
                        onChange={(e) => handleUpdatePortfolioItem(item.id, 'title', e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                        disabled={isSaving}
                      />

                      <Select
                        value={item.type}
                        onValueChange={(value) => handleUpdatePortfolioItem(item.id, 'type', value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="image">Bild</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>

                      {item.type === 'image' ? (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadPortfolioImage(item.id, file);
                              e.target.value = ''; // Clear input after selection
                            }}
                            className="hidden"
                            id={`portfolio-upload-${item.id}`}
                            disabled={uploadingPortfolioImage || isSaving}
                          />
                          <label
                            htmlFor={`portfolio-upload-${item.id}`}
                            className={`flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg transition-colors ${
                                uploadingPortfolioImage || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-500'
                            }`}
                          >
                            {uploadingPortfolioImage ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm">
                              {uploadingPortfolioImage ? 'Wird hochgeladen...' : 'Bild hochladen'}
                            </span>
                          </label>
                          {item.url && (
                            <img src={item.url} alt="Vorschau" className="mt-2 w-full h-32 object-cover rounded-lg border border-zinc-700" />
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder={item.type === 'video' ? 'Video-URL' : 'Link-URL'}
                          value={item.url}
                          onChange={(e) => handleUpdatePortfolioItem(item.id, 'url', e.target.value)}
                          className="bg-zinc-900 border-zinc-700"
                          disabled={isSaving}
                        />
                      )}

                      <Textarea
                        placeholder="Beschreibung (optional)"
                        value={item.description}
                        onChange={(e) => handleUpdatePortfolioItem(item.id, 'description', e.target.value)}
                        className="bg-zinc-900 border-zinc-700 h-16"
                        disabled={isSaving}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white">Privatsphäre</label>
                <div className="space-y-3">
                  {PRIVACY_MODES.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => handleChange('privacy_mode', mode.value)}
                      disabled={isSaving}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        formData.privacy_mode === mode.value
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className="text-sm font-semibold text-white mb-1">{mode.label}</p>
                      <p className="text-xs text-zinc-500">{mode.description}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-white">Online-Status anzeigen</span>
                    <input
                      type="checkbox"
                      checked={formData.preferences?.show_online_status !== false}
                      onChange={(e) => handlePreferenceChange('show_online_status', e.target.checked)}
                      disabled={isSaving}
                      className="w-5 h-5 rounded bg-zinc-900 border-zinc-700"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-white">Profilaufrufe erlauben</span>
                    <input
                      type="checkbox"
                      checked={formData.preferences?.allow_profile_views !== false}
                      onChange={(e) => handlePreferenceChange('allow_profile_views', e.target.checked)}
                      disabled={isSaving}
                      className="w-5 h-5 rounded bg-zinc-900 border-zinc-700"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 flex gap-3 bg-zinc-900/50">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-zinc-700"
                disabled={isSaving}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Speichern
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
