import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePostStore } from '../stores/usePostStore';
import { base44 } from '@/api/base44Client';

/**
 * 🎯 TYPE-SAFE POST HOOK
 * Handles post reactions, bookmarks, and deletion
 * 
 * @returns {{
 *   handleReaction: (postId: string, reactionType: string) => Promise<void>,
 *   handleBookmark: (postId: string) => Promise<void>,
 *   handleDelete: (postId: string) => Promise<void>,
 *   handleCommentAdded: (postId: string) => void
 * }}
 */
export function useTypeSafePost() {
  const { 
    updatePost,
    toggleReaction, 
    toggleBookmark,
    deletePost,
    incrementCommentCount
  } = usePostStore();

  const handleReaction = useCallback(async (postId, reactionType) => {
    if (!postId || !reactionType) {
      console.error('❌ Missing postId or reactionType');
      return;
    }

    const userEmail = window.currentUserEmail;
    if (!userEmail) {
      toast.error('Bitte melde dich an');
      return;
    }

    console.log('❤️ handleReaction:', { postId, reactionType });

    // Optimistic update
    toggleReaction(postId, reactionType, userEmail);

    try {
      const response = await base44.functions.invoke('updatePostReaction', { 
        postId, 
        reactionType 
      });

      if (!response?.data?.ok) {
        throw new Error(response?.data?.message || 'Reaction failed');
      }

      console.log('✅ Reaction successful');

    } catch (error) {
      console.error('❌ Reaction error:', error);
      
      // Rollback
      toggleReaction(postId, reactionType, userEmail);
      
      toast.error('Reaktion fehlgeschlagen');
    }
  }, [toggleReaction]);

  const handleBookmark = useCallback(async (postId) => {
    if (!postId) {
      console.error('❌ Missing postId');
      return;
    }

    const userEmail = window.currentUserEmail;
    if (!userEmail) {
      toast.error('Bitte melde dich an');
      return;
    }

    console.log('🔖 handleBookmark:', postId);

    // Optimistic update
    toggleBookmark(postId, userEmail);

    try {
      const response = await base44.functions.invoke('togglePostBookmark', { postId });

      if (!response?.data?.ok) {
        throw new Error(response?.data?.message || 'Bookmark failed');
      }

      const bookmarked = response.data?.data?.bookmarked;
      
      toast.success(
        bookmarked ? 'Zu Lesezeichen hinzugefügt' : 'Von Lesezeichen entfernt'
      );

      console.log('✅ Bookmark successful');

    } catch (error) {
      console.error('❌ Bookmark error:', error);
      
      // Rollback
      toggleBookmark(postId, userEmail);
      
      toast.error('Lesezeichen-Aktion fehlgeschlagen');
    }
  }, [toggleBookmark]);

  const handleDelete = useCallback(async (postId) => {
    if (!postId) {
      console.error('❌ Missing postId');
      return;
    }

    console.log('🗑️ handleDelete:', postId);

    try {
      await base44.entities.Post.delete(postId);
      
      deletePost(postId);
      
      toast.success('Post gelöscht');
      
      console.log('✅ Delete successful');

    } catch (error) {
      console.error('❌ Delete error:', error);
      
      toast.error('Löschen fehlgeschlagen');
    }
  }, [deletePost]);

  const handleCommentAdded = useCallback((postId) => {
    if (!postId) {
      console.error('❌ Missing postId');
      return;
    }

    console.log('💬 handleCommentAdded:', postId);
    incrementCommentCount(postId);
  }, [incrementCommentCount]);

  return {
    handleReaction,
    handleBookmark,
    handleDelete,
    handleCommentAdded,
  };
}

export default useTypeSafePost;