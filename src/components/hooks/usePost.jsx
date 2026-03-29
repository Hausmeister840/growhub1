import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import HapticService from '../services/HapticService';

export function usePost() {

  const handleReaction = useCallback(async (postId, reactionType = 'like', currentUser = null, onSuccess = null, currentReactions = null) => {
    if (!currentUser?.email) {
      toast.error('Bitte melde dich an');
      return;
    }

    // Haptic feedback
    HapticService.light();

    try {
      // Verwende übergebene Reactions wenn vorhanden, sonst fetch
      let reactions = currentReactions;
      
      if (!reactions) {
        try {
          const allPosts = await base44.entities.Post.filter({ id: postId });
          reactions = allPosts?.[0]?.reactions;
        } catch {
          // Ignore
        }
      }

      reactions = reactions || {
        like: { count: 0, users: [] },
        fire: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        mind_blown: { count: 0, users: [] },
        helpful: { count: 0, users: [] },
        celebrate: { count: 0, users: [] }
      };

      const reaction = reactions[reactionType] || { count: 0, users: [] };
      const hasReacted = reaction.users?.includes(currentUser.email);

      const updatedReactions = {
        ...reactions,
        [reactionType]: {
          count: hasReacted ? Math.max(0, reaction.count - 1) : reaction.count + 1,
          users: hasReacted 
            ? (reaction.users || []).filter(email => email !== currentUser.email)
            : [...(reaction.users || []), currentUser.email]
        }
      };

      // Optimistic UI update sofort
      if (onSuccess) {
        onSuccess(updatedReactions);
      }

      // Backend update via toggle function
      await base44.functions.invoke('posts/toggleReaction', {
        postId,
        reactionType
      });

    } catch (error) {
      console.error('Reaction error:', error);
      HapticService.error();
      toast.error('Fehler beim Reagieren');
      
      // Rollback on error
      if (onSuccess && currentReactions) {
        onSuccess(currentReactions);
      }
    }
  }, []);

  const handleBookmark = useCallback(async (postId, currentUser = null, onSuccess = null, currentBookmarks = null) => {
    if (!currentUser?.email) {
      toast.error('Bitte melde dich an');
      return;
    }

    // Haptic feedback
    HapticService.medium();

    try {
      // Verwende übergebene Bookmarks wenn vorhanden
      let bookmarked = currentBookmarks;
      
      if (!bookmarked) {
        try {
          const allPosts = await base44.entities.Post.filter({ id: postId });
          bookmarked = allPosts?.[0]?.bookmarked_by_users;
        } catch {
          // Ignore
        }
      }

      bookmarked = bookmarked || [];
      const isBookmarked = bookmarked.includes(currentUser.email);

      const updatedBookmarks = isBookmarked
        ? bookmarked.filter(email => email !== currentUser.email)
        : [...bookmarked, currentUser.email];

      // Optimistic UI update sofort
      if (onSuccess) {
        onSuccess(updatedBookmarks);
      }
      toast.success(isBookmarked ? 'Entfernt' : 'Gespeichert!');

      // Backend update via toggle function
      await base44.functions.invoke('posts/toggleBookmark', {
        postId,
        bookmarked: !isBookmarked
      });

    } catch (error) {
      console.error('Bookmark error:', error);
      HapticService.error();
      toast.error('Fehler beim Speichern');
      
      // Rollback on error
      if (onSuccess && currentBookmarks) {
        onSuccess(currentBookmarks);
      }
    }
  }, []);

  const handleDelete = useCallback(async (postId, currentUser = null, onSuccess = null) => {
    if (!currentUser?.email) {
      toast.error('Bitte melde dich an');
      return;
    }

    try {
      await base44.entities.Post.delete(postId);
      toast.success('Post gelöscht');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  }, []);

  return {
    handleReaction,
    handleBookmark,
    handleDelete
  };
}