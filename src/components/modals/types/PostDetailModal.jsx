
import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { isVideoUrl } from "@/components/utils/media";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";

export default function PostDetailModal({ data }) {
  // Null-safe post model
  const post = data || {};
  const [localPost, setLocalPost] = useState(post);
  const [meEmail, setMeEmail] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const media = Array.isArray(localPost?.media_urls) ? localPost.media_urls.filter(Boolean) : [];
  const currentUrl = media[activeIndex] || null;
  const contentText = typeof localPost?.content === "string" ? localPost.content : "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await User.me();
        if (mounted) setMeEmail(me.email);
      } catch {
        if (mounted) setMeEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // If incoming data changes, sync local state
    setLocalPost(post || {});
    setActiveIndex(0);
  }, [post]); // FIX: include 'post' as dependency

  const likedByMe = useMemo(() => {
    if (!meEmail) return false;
    return !!localPost?.reactions?.like?.users?.includes(meEmail);
  }, [localPost?.reactions?.like?.users, meEmail]);

  const likeCount = localPost?.reactions?.like?.count || 0;
  const bookmarkedByMe = useMemo(() => {
    if (!meEmail) return false;
    return !!localPost?.bookmarked_by_users?.includes(meEmail);
  }, [localPost?.bookmarked_by_users, meEmail]);

  const timeAgo = useMemo(() => {
    const d = localPost?.created_date;
    if (!d) return "gerade eben";
    return formatDistanceToNow(new Date(d), { addSuffix: true, locale: de });
  }, [localPost?.created_date]);

  const toggleLike = useCallback(async () => {
    try {
      const reactions = JSON.parse(JSON.stringify(localPost?.reactions || {}));
      reactions.like = reactions.like || { count: 0, users: [] };
      reactions.like.users = reactions.like.users || [];
      const has = meEmail && reactions.like.users.includes(meEmail);

      if (has) {
        reactions.like.users = reactions.like.users.filter((e) => e !== meEmail);
        reactions.like.count = Math.max(0, (reactions.like.count || 0) - 1);
      } else if (meEmail) {
        reactions.like.users.push(meEmail);
        reactions.like.count = (reactions.like.count || 0) + 1;
      }
      setLocalPost((p) => ({ ...p, reactions }));
      if (localPost?.id) await Post.update(localPost.id, { reactions });
      if (navigator.vibrate) navigator.vibrate(20);
    } catch {
      // ignore
    }
  }, [localPost?.id, localPost?.reactions, meEmail]);

  const toggleBookmark = useCallback(async () => {
    if (!meEmail) return;
    try {
      const prev = localPost?.bookmarked_by_users || [];
      const isSet = prev.includes(meEmail);
      const next = isSet ? prev.filter((e) => e !== meEmail) : [...prev, meEmail];
      setLocalPost((p) => ({ ...p, bookmarked_by_users: next }));
      if (localPost?.id) await Post.update(localPost.id, { bookmarked_by_users: next });
      if (navigator.vibrate) navigator.vibrate(15);
    } catch {
      // ignore
    }
  }, [localPost?.id, localPost?.bookmarked_by_users, meEmail]);

  const onShare = useCallback(async () => {
    const url = `${window.location.origin}${createPageUrl("Feed")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GrowHub", text: contentText.slice(0, 100), url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore
    }
  }, [contentText]);

  const openComments = useCallback(() => {
    if (!localPost) return;
    window.dispatchEvent(new CustomEvent("openCommentsForPost", { detail: localPost }));
  }, [localPost]);

  const nextMedia = () => setActiveIndex((i) => (i + 1) % Math.max(media.length || 1, 1));
  const prevMedia = () => setActiveIndex((i) => (i - 1 + Math.max(media.length || 1, 1)) % Math.max(media.length || 1, 1));

  // Render
  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr_auto]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
            {(localPost?.created_by || "?")[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 truncate">{localPost?.created_by?.split("@")[0] || "User"}</div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label={bookmarkedByMe ? "Aus Lesezeichen entfernen" : "Zu Lesezeichen hinzufügen"}
            onClick={toggleBookmark}
            variant="ghost"
            size="icon"
            className={`text-zinc-300 hover:text-yellow-400 ${bookmarkedByMe ? "text-yellow-400" : ""}`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarkedByMe ? "fill-current" : ""}`} />
          </Button>
          <Button aria-label="Teilen" onClick={onShare} variant="ghost" size="icon" className="text-zinc-300 hover:text-green-400">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full h-full">
        {/* Media area */}
        <div className="relative bg-black flex items-center justify-center">
          {currentUrl ? (
            isVideoUrl(currentUrl) ? (
              <video src={currentUrl} controls className="w-full h-full object-contain" />
            ) : (
              <ImageWithFallback src={currentUrl} alt="Post media" className="w-full h-full object-contain bg-black" />
            )
          ) : (
            <div className="text-zinc-500 text-sm">Kein Medium</div>
          )}

          {media.length > 1 && (
            <>
              <button
                aria-label="Vorheriges Medium"
                onClick={prevMedia}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Nächstes Medium"
                onClick={nextMedia}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 border border-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === activeIndex ? "bg-white" : "bg-white/40"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Text area */}
        <div className="flex flex-col overflow-y-auto bg-zinc-950/60 border-l border-zinc-800/60">
          <div className="p-4 space-y-3">
            {contentText && (
              <div className="text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap">
                {contentText}
              </div>
            )}

            {/* Tags */}
            {Array.isArray(localPost?.tags) && localPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localPost.tags.slice(0, 8).map((tag, idx) => (
                  <Badge key={`${tag}-${idx}`} className="bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60 bg-zinc-950/70">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={toggleLike}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              likedByMe ? "bg-red-500/10 text-red-400" : "hover:bg-zinc-800/70 text-zinc-300"
            }`}
            aria-label="Beitrag liken"
            title="Gefällt mir"
          >
            <Heart className={`w-4 h-4 ${likedByMe ? "fill-current" : ""}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </motion.button>

          <motion.button
            type="button"
            onClick={openComments}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm hover:bg-blue-500/10 text-zinc-300 hover:text-blue-400"
            aria-label="Kommentare öffnen"
            title="Kommentare"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{localPost?.comments_count || 0}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
