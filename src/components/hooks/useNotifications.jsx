import { useCallback } from 'react';
import { notificationService } from '../notifications/NotificationService';

/**
 * Hook to easily trigger notifications from components
 */
export function useNotifications() {
  const notifyLike = useCallback(async (postId, likerEmail, postAuthorEmail) => {
    await notificationService.notifyLike(postId, likerEmail, postAuthorEmail);
  }, []);

  const notifyComment = useCallback(async (postId, commenterEmail, postAuthorEmail, commentText) => {
    await notificationService.notifyComment(postId, commenterEmail, postAuthorEmail, commentText);
  }, []);

  const notifyMention = useCallback(async (postId, mentionerEmail, mentionedEmail, content) => {
    await notificationService.notifyMention(postId, mentionerEmail, mentionedEmail, content);
  }, []);

  const notifyFollow = useCallback(async (followerEmail, followedEmail) => {
    await notificationService.notifyFollow(followerEmail, followedEmail);
  }, []);

  const notifyNewPost = useCallback(async (postId, authorEmail, followerEmails) => {
    await notificationService.notifyNewPost(postId, authorEmail, followerEmails);
  }, []);

  const notifyMessage = useCallback(async (conversationId, senderEmail, recipientEmail, messagePreview) => {
    await notificationService.notifyMessage(conversationId, senderEmail, recipientEmail, messagePreview);
  }, []);

  return {
    notifyLike,
    notifyComment,
    notifyMention,
    notifyFollow,
    notifyNewPost,
    notifyMessage
  };
}