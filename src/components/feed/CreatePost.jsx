import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, Image as ImageIcon, MapPin, Hash, 
  Loader2, Sparkles, Globe, Users, Lock, Wand2, MessageSquare,
  HelpCircle, BookOpen, Star, Trash2, Send, Plus, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import { Leaf, ChevronRight } from 'lucide-react';
import GlobalErrorHandler from '../utils/GlobalErrorHandler';
import { rateLimiter } from '../utils/RateLimiter';
import validators from '../security/DataValidation';

const MAX_MEDIA = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_POLL_OPTIONS = 6;

const POST_TYPES = [
  { value: 'general', label: 'Allgemein', icon: MessageSquare, color: 'text-zinc-400' },
  { value: 'question', label: 'Frage', icon: HelpCircle, color: 'text-blue-400' },
  { value: 'tutorial', label: 'Tutorial', icon: BookOpen, color: 'text-purple-400' },
  { value: 'review', label: 'Review', icon: Star, color: 'text-amber-400' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Öffentlich', icon: Globe, desc: 'Jeder' },
  { value: 'friends', label: 'Freunde', icon: Users, desc: 'Follower' },
  { value: 'private', label: 'Privat', icon: Lock, desc: 'Nur du' }
];

export default function CreatePost({ isOpen, onClose, onPostCreated, currentUser, editPost = null }) {
  const [content, setContent] = useState(editPost?.content || '');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUrls, setMediaUrls] = useState(editPost?.media_urls || []);
  const [tags, setTags] = useState(editPost?.tags || []);
  const [visibility, setVisibility] = useState(editPost?.visibility || 'public');
  const [postType, setPostType] = useState(editPost?.post_type || 'general');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  const [growDiaries, setGrowDiaries] = useState([]);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [showDiaryPicker, setShowDiaryPicker] = useState(false);
  const [alsoAddToEntry, setAlsoAddToEntry] = useState(false);
  
  const [activeSnap, setActiveSnap] = useState(0.6);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const isEditMode = !!editPost;

  React.useEffect(() => {
    if (isOpen && currentUser) {
      base44.entities.GrowDiary.filter({ created_by: currentUser.email }, '-created_date', 20)
        .then(d => setGrowDiaries(d || []))
        .catch(() => setGrowDiaries([]));
    }
  }, [isOpen, currentUser]);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Close on route change
  React.useEffect(() => {
    const handleRouteChange = () => onClose();
    window.addEventListener('routeChange', handleRouteChange);
    return () => window.removeEventListener('routeChange', handleRouteChange);
  }, [onClose]);

  const charCountColor = useMemo(() => {
    const len = content.length;
    if (len > 4500) return 'text-red-400';
    if (len > 4000) return 'text-amber-400';
    return 'text-zinc-500';
  }, [content.length]);

  const handleMediaSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const currentMediaCount = (mediaFiles?.length || 0) + (mediaUrls?.length || 0);
    if (currentMediaCount + files.length > MAX_MEDIA) {
      toast.error(`Maximal ${MAX_MEDIA} Medien erlaubt`);
      return;
    }
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} ist zu groß (max 100MB)`);
        return false;
      }
      return true;
    });
    setMediaFiles(prev => [...(prev || []), ...validFiles]);
  }, [mediaFiles, mediaUrls]);

  const removeMedia = useCallback((index) => {
    const urlsLength = mediaUrls?.length || 0;
    if (index < urlsLength) {
      setMediaUrls(prev => (prev || []).filter((_, i) => i !== index));
    } else {
      setMediaFiles(prev => (prev || []).filter((_, i) => i !== (index - urlsLength)));
    }
  }, [mediaUrls]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !(tags || []).includes(tag) && (tags || []).length < 10) {
      setTags(prev => [...(prev || []), tag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove) => {
    setTags(prev => (prev || []).filter(t => t !== tagToRemove));
  }, []);

  const handleAIImprove = useCallback(async () => {
    if (!content.trim()) { toast.error('Bitte schreibe zuerst etwas'); return; }
    setIsAIGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Verbessere folgenden Social-Media-Post. Mache ihn ansprechender, aber behalte die Hauptaussage bei. Verwende eine lockere, freundliche Sprache:\n\n"${content}"`,
        response_json_schema: { type: 'object', properties: { improved_text: { type: 'string' } } }
      });
      if (response.improved_text) { setContent(response.improved_text); toast.success('✨ Text verbessert!'); }
    } catch { toast.error('KI-Verbesserung fehlgeschlagen'); }
    finally { setIsAIGenerating(false); }
  }, [content]);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Standort wird nicht unterstützt'); return; }
    toast.info('Standort wird abgerufen...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
          const data = await res.json();
          const locationString = data.address?.city || data.address?.town || data.address?.village || 'Unbekannter Ort';
          setLocation(locationString);
          toast.success(`📍 Standort: ${locationString}`);
        } catch { setLocation('Mein Standort'); toast.success('📍 Standort hinzugefügt'); }
      },
      () => { toast.error('Standort konnte nicht abgerufen werden'); }
    );
  }, []);

  const handleSubmit = async () => {
    if (!currentUser) { toast.error("Bitte melde dich an"); return; }
    if (!rateLimiter.canMakeRequest(`post_${currentUser.email}`, 5, 60000)) {
      toast.error("Zu viele Posts in kurzer Zeit. Bitte warte kurz."); return;
    }
    const hasMedia = (mediaFiles?.length || 0) > 0 || (mediaUrls?.length || 0) > 0;
    if (!content.trim() && !hasMedia) { toast.error("Bitte füge Text oder Medien hinzu"); return; }
    const sanitizedContent = validators.sanitizeText(content, 5000);
    if (sanitizedContent.length > 5000) { toast.error("Text ist zu lang (max. 5000 Zeichen)"); return; }
    const spamCheck = validators.detectSpam(sanitizedContent);
    if (spamCheck.isSpam) { toast.error(`Post nicht erlaubt: ${spamCheck.reasons.join(', ')}`); return; }

    setIsSubmitting(true);
    if (navigator.vibrate) navigator.vibrate(10);

    try {
      let finalMediaUrls = [...(mediaUrls || [])];
      if (mediaFiles && mediaFiles.length > 0) {
        setIsUploading(true);
        try {
          const uploadPromises = mediaFiles.map(async (file) => {
            const { file_url } = await GlobalErrorHandler.withRetry(
              () => base44.integrations.Core.UploadFile({ file }), 3, 1000
            );
            return file_url;
          });
          const newlyUploadedUrls = await Promise.all(uploadPromises);
          finalMediaUrls = [...finalMediaUrls, ...newlyUploadedUrls.filter(Boolean)];
        } catch (uploadError) {
          GlobalErrorHandler.handleError(uploadError, 'Media Upload');
          setIsSubmitting(false); setIsUploading(false); return;
        }
        setIsUploading(false);
      }

      const finalTags = [...new Set(tags || [])].slice(0, 10);
      const tagValidation = validators.validateTags(finalTags, 10, 30);
      if (!tagValidation.valid) { toast.error(tagValidation.error); setIsSubmitting(false); return; }

      const postData = {
        content: sanitizedContent, media_urls: finalMediaUrls, tags: tagValidation.value,
        visibility, post_type: postType, status: 'published',
        reactions: { like: { count: 0, users: [] }, fire: { count: 0, users: [] }, laugh: { count: 0, users: [] }, mind_blown: { count: 0, users: [] }, helpful: { count: 0, users: [] }, celebrate: { count: 0, users: [] } },
        comments_count: 0, bookmarked_by_users: []
      };
      if (location) postData.location = location;
      if (showPoll && pollOptions && pollOptions.filter(o => o?.trim()).length >= 2) {
        postData.poll = { options: pollOptions.filter(o => o?.trim()).map(option => ({ text: option.trim(), votes: 0, voted_users: [] })), total_votes: 0, ends_at: null };
      }
      if (selectedDiaryId) { postData.grow_diary_id = selectedDiaryId; postData.post_type = 'grow_diary_update'; }

      if (isEditMode) {
        await base44.entities.Post.update(editPost.id, postData);
        toast.success('✅ Post aktualisiert!');
      } else {
        await base44.entities.Post.create(postData);
        toast.success('✅ Post erstellt!');
      }

      if (selectedDiaryId && alsoAddToEntry && finalMediaUrls.length > 0) {
        try {
          const diary = growDiaries.find(d => d.id === selectedDiaryId);
          await base44.entities.GrowDiaryEntry.create({
            diary_id: selectedDiaryId, day_number: (diary?.stats?.total_days || 0) + 1,
            growth_stage: diary?.current_stage || 'Wachstum', plant_observation: sanitizedContent || '',
            media_urls: finalMediaUrls, entry_date: new Date().toISOString(),
          });
          toast.success('📔 Auch ins Grow Tagebuch eingetragen!');
        } catch {}
      }

      setContent(''); setMediaFiles([]); setMediaUrls([]); setTags([]); setVisibility('public');
      setPostType('general'); setLocation(''); setPollOptions(['', '']); setShowPoll(false);
      setSelectedDiaryId(null); setAlsoAddToEntry(false); setShowDiaryPicker(false);

      onClose?.();
      onPostCreated?.();
    } catch (error) {
      GlobalErrorHandler.handleError(error, 'Post Submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMedia = (mediaFiles?.length || 0) + (mediaUrls?.length || 0);
  const canSubmit = (content.trim() || totalMedia > 0) && !isSubmitting && !isUploading;

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
      snapPoints={[0.6, 1]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setActiveSnap}
      fadeFromIndex={1}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[299] bg-black/60 backdrop-blur-sm" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[300] flex flex-col rounded-t-3xl border-t border-zinc-700/70 bg-gradient-to-b from-zinc-900 to-zinc-950 outline-none"
          style={{ maxHeight: activeSnap === 1 ? '100vh' : '60vh' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <DrawerPrimitive.Title className="text-lg font-bold text-white leading-tight">
                  {isEditMode ? 'Post bearbeiten' : 'Neuer Post'}
                </DrawerPrimitive.Title>
                <p className="text-[11px] text-zinc-500">
                  Teile Updates, Medien oder Fragen mit der Community
                </p>
              </div>
            </div>
            <DrawerPrimitive.Close className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </DrawerPrimitive.Close>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-4" style={{ minHeight: 0 }}>
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-10 h-10 rounded-full object-cover border border-zinc-700/50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {currentUser.full_name?.[0] || currentUser.email?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white text-sm">{currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Nutzer'}</p>
                  <p className="text-xs text-zinc-500">Posten als {currentUser.email}</p>
                </div>
              </div>
            )}

            {/* Post Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Beitragstyp</label>
              <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = postType === type.value;
                return (
                  <button key={type.value} onClick={() => setPostType(type.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]'
                        : 'bg-zinc-800/40 border border-zinc-700/40 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />{type.label}
                  </button>
                );
              })}
              </div>
            </div>

            {/* Textarea with AI */}
            <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-2">
              <Textarea
              ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Was gibt's Neues in deinem Grow, deiner Community oder im Alltag?"
              className="min-h-[140px] bg-transparent border-transparent text-white placeholder:text-zinc-500 resize-none rounded-xl focus:border-transparent focus:ring-0 pr-12 text-sm"
              maxLength={5000}
              />
              <div className="absolute top-3 right-3">
                <button onClick={() => setShowAI(!showAI)}
                  className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
                  title="KI-Assistent">
                  <Wand2 className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                </button>
                <AnimatePresence>
                  {showAI && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden z-10">
                      <div className="p-2">
                        <button onClick={handleAIImprove} disabled={isAIGenerating || !content.trim()}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-left transition-all disabled:opacity-50 group">
                          <Sparkles className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-zinc-300 group-hover:text-white">Text verbessern</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Character Count */}
            <div className="flex justify-between items-center text-xs px-1">
              <span className="text-zinc-500">
                {isAIGenerating && <span className="flex items-center gap-2 text-purple-400"><Loader2 className="w-3 h-3 animate-spin" />KI arbeitet...</span>}
              </span>
              <span className={charCountColor}>{content.length} / 5000</span>
            </div>

            {/* Quick Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/60 p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-zinc-300">Hashtags</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="z. B. indoor"
                    className="h-8 flex-1 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-green-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-800/70 text-zinc-300 hover:text-white hover:border-zinc-500 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPoll(v => !v)}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  showPoll
                    ? 'border-purple-500/40 bg-purple-500/10'
                    : 'border-zinc-700/40 bg-zinc-900/60 hover:bg-zinc-900/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className={`w-3.5 h-3.5 ${showPoll ? 'text-purple-300' : 'text-zinc-400'}`} />
                  <span className={`text-xs font-semibold ${showPoll ? 'text-purple-200' : 'text-zinc-300'}`}>Umfrage</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  {showPoll ? 'Umfrage aktiv' : 'Optional hinzufügen'}
                </p>
              </button>
            </div>

            {showPoll && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-purple-200">Umfrageoptionen</p>
                {(pollOptions || []).map((opt, idx) => (
                  <input
                    key={idx}
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[idx] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-purple-400/50"
                  />
                ))}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pollOptions.length < MAX_POLL_OPTIONS) setPollOptions(prev => [...prev, '']);
                    }}
                    className="text-xs text-purple-200 hover:text-white"
                  >
                    + Option hinzufügen
                  </button>
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(prev => prev.slice(0, -1))}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Letzte entfernen
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Media Preview */}
            {totalMedia > 0 && (
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-2">
                {[...(mediaUrls || []), ...(mediaFiles || [])].map((item, index) => {
                  const url = typeof item === 'string' ? item : URL.createObjectURL(item);
                  const isVideo = /\.(mp4|mov|webm)$/i.test(url) || (item instanceof File && item.type.startsWith('video/'));
                  return (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900/50 group border border-zinc-700/30">
                      {isVideo ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removeMedia(index)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tags */}
            {(tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(tags || []).map(tag => (
                  <div key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                    <Hash className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">{tag}</span>
                    <button onClick={() => removeTag(tag)} className="ml-0.5"><X className="w-3 h-3 text-green-400/60" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-700/30 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-zinc-300">{location}</span>
                <button onClick={() => setLocation('')} className="ml-auto text-zinc-400 hover:text-zinc-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Grow Diary Picker */}
            {growDiaries.length > 0 && (
              <div className="space-y-2">
                <button type="button" onClick={() => setShowDiaryPicker(v => !v)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedDiaryId ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600'}`}>
                  <Leaf className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{selectedDiaryId ? `📔 ${growDiaries.find(d => d.id === selectedDiaryId)?.name || 'Grow Tagebuch'}` : 'Zu Grow Tagebuch hinzufügen?'}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showDiaryPicker ? 'rotate-90' : ''}`} />
                </button>
                {showDiaryPicker && (
                  <div className="space-y-1.5 pt-1">
                    <button type="button" onClick={() => { setSelectedDiaryId(null); setShowDiaryPicker(false); setAlsoAddToEntry(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${!selectedDiaryId ? 'bg-zinc-700 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                      <span>Kein Tagebuch</span>
                    </button>
                    {growDiaries.map(diary => (
                      <button key={diary.id} type="button" onClick={() => { setSelectedDiaryId(diary.id); setShowDiaryPicker(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${selectedDiaryId === diary.id ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}>
                        <span className="text-lg">{diary.current_stage === 'Blüte' ? '🌸' : diary.current_stage === 'Wachstum' ? '🌳' : diary.current_stage === 'Keimung' ? '🌱' : diary.current_stage === 'Ernte' ? '🏆' : '🌿'}</span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{diary.name}</p>
                          {diary.strain_name && <p className="text-xs text-zinc-500 truncate">{diary.strain_name} · {diary.current_stage}</p>}
                        </div>
                        {selectedDiaryId === diary.id && <span className="text-green-400 text-xs">✓</span>}
                      </button>
                    ))}
                    {selectedDiaryId && (mediaFiles.length > 0 || mediaUrls.length > 0) && (
                      <button type="button" onClick={() => setAlsoAddToEntry(v => !v)}
                        className={`mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${alsoAddToEntry ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:text-white'}`}>
                        <span className="w-4 h-4 rounded border border-current flex items-center justify-center">{alsoAddToEntry && <span className="text-[10px]">✓</span>}</span>
                        Foto/Video auch als Tagebuch-Eintrag speichern
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Sichtbarkeit</label>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-1.5">
                {VISIBILITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = visibility === option.value;
                  return (
                    <button key={option.value} onClick={() => setVisibility(option.value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-green-500/20 border border-green-500/50' : 'bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-800/50'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-zinc-400'}`} />
                      <p className={`text-xs font-semibold ${isActive ? 'text-green-400' : 'text-zinc-300'}`}>{option.label}</p>
                      <p className="text-[10px] text-zinc-500">{option.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/70 bg-zinc-950/90 backdrop-blur-sm pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaSelect} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon"
                className="rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white" disabled={isUploading || totalMedia >= MAX_MEDIA} title="Medien">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button onClick={handleGetLocation} variant="ghost" size="icon"
                className="rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white" title="Standort">
                <MapPin className="w-5 h-5" />
              </Button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <span>{totalMedia}/{MAX_MEDIA} Medien</span>
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-2.5 text-sm rounded-full shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all">
              {isUploading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Hochladen...</> :
               isSubmitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{isEditMode ? 'Aktualisiere...' : 'Poste...'}</> :
               <><Send className="w-4 h-4 mr-1.5" />{isEditMode ? 'Aktualisieren' : 'Posten'}</>}
            </Button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}