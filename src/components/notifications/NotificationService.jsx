import { base44 } from '@/api/base44Client';
import { notificationManager } from './NotificationManager';
import { buildUserLookup, fetchUserByEmail, fetchUsersByEmails } from '@/api/userDirectory';

/**
 * 🔔 NOTIFICATION SERVICE
 * Handles creating and sending notifications for various events
 */

class NotificationService {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async createNotification(data) {
    try {
      await base44.entities.Notification.create(data);
      console.log('✅ Notification created:', data.type);
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  async getUserLookup(emails = []) {
    const users = await fetchUsersByEmails(emails);
    return buildUserLookup(users);
  }

  async sendPushNotification(recipientEmail, title, body, url = null) {
    try {
      const recipient = await fetchUserByEmail(recipientEmail);
      
      if (!recipient?.notification_settings?.push_enabled) {
        console.log('⏭️ User has push notifications disabled');
        return;
      }

      // Show browser notification if user is online
      if ('Notification' in window && Notification.permission === 'granted') {
        notificationManager.showNotification(title, {
          body,
          url,
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        });
      }
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  async notifyLike(postId, likerEmail, postAuthorEmail) {
    if (likerEmail === postAuthorEmail) return; // Don't notify self

    try {
      const users = await this.getUserLookup([likerEmail, postAuthorEmail]);
      const liker = users[likerEmail] || users[likerEmail?.toLowerCase()];
      const author = users[postAuthorEmail] || users[postAuthorEmail?.toLowerCase()];

      if (!author?.notification_settings?.likes) return;

      const data = {
        recipient_email: postAuthorEmail,
        sender_email: likerEmail,
        sender_id: liker?.id,
        type: 'like',
        post_id: postId,
        message: `${liker?.full_name || 'Jemand'} hat deinen Post geliked`
      };

      await this.createNotification(data);
      await this.sendPushNotification(
        postAuthorEmail,
        '❤️ Neuer Like',
        data.message,
        `/Post?id=${postId}`
      );
    } catch (error) {
      console.error('Error in notifyLike:', error);
    }
  }

  async notifyComment(postId, commenterEmail, postAuthorEmail, commentText) {
    if (commenterEmail === postAuthorEmail) return;

    try {
      const users = await this.getUserLookup([commenterEmail, postAuthorEmail]);
      const commenter = users[commenterEmail] || users[commenterEmail?.toLowerCase()];
      const author = users[postAuthorEmail] || users[postAuthorEmail?.toLowerCase()];

      if (!author?.notification_settings?.comments) return;

      const data = {
        recipient_email: postAuthorEmail,
        sender_email: commenterEmail,
        sender_id: commenter?.id,
        type: 'comment',
        post_id: postId,
        message: `${commenter?.full_name || 'Jemand'} hat deinen Post kommentiert: "${commentText.substring(0, 50)}..."`
      };

      await this.createNotification(data);
      await this.sendPushNotification(
        postAuthorEmail,
        '💬 Neuer Kommentar',
        data.message,
        `/Post?id=${postId}`
      );
    } catch (error) {
      console.error('Error in notifyComment:', error);
    }
  }

  async notifyMention(postId, mentionerEmail, mentionedEmail, content) {
    if (mentionerEmail === mentionedEmail) return;

    try {
      const users = await this.getUserLookup([mentionerEmail, mentionedEmail]);
      const mentioner = users[mentionerEmail] || users[mentionerEmail?.toLowerCase()];
      const mentioned = users[mentionedEmail] || users[mentionedEmail?.toLowerCase()];

      if (!mentioned?.notification_settings?.mentions) return;

      const data = {
        recipient_email: mentionedEmail,
        sender_email: mentionerEmail,
        sender_id: mentioner?.id,
        type: 'mention',
        post_id: postId,
        message: `${mentioner?.full_name || 'Jemand'} hat dich in einem Post erwähnt`
      };

      await this.createNotification(data);
      await this.sendPushNotification(
        mentionedEmail,
        '@ Erwähnung',
        data.message,
        `/Post?id=${postId}`
      );
    } catch (error) {
      console.error('Error in notifyMention:', error);
    }
  }

  async notifyFollow(followerEmail, followedEmail) {
    if (followerEmail === followedEmail) return;

    try {
      const users = await this.getUserLookup([followerEmail, followedEmail]);
      const follower = users[followerEmail] || users[followerEmail?.toLowerCase()];
      const followed = users[followedEmail] || users[followedEmail?.toLowerCase()];

      if (!followed?.notification_settings?.new_followers) return;

      const data = {
        recipient_email: followedEmail,
        sender_email: followerEmail,
        sender_id: follower?.id,
        type: 'follow',
        message: `${follower?.full_name || 'Jemand'} folgt dir jetzt`
      };

      await this.createNotification(data);
      await this.sendPushNotification(
        followedEmail,
        '👋 Neuer Follower',
        data.message,
        `/Profile?id=${follower?.id}`
      );
    } catch (error) {
      console.error('Error in notifyFollow:', error);
    }
  }

  async notifyNewPost(postId, authorEmail, followerEmails) {
    try {
      const users = await this.getUserLookup([authorEmail, ...followerEmails]);
      const author = users[authorEmail] || users[authorEmail?.toLowerCase()];

      // Notify all followers who have this setting enabled
      for (const followerEmail of followerEmails) {
        const follower = users[followerEmail] || users[followerEmail?.toLowerCase()];
        if (!follower?.notification_settings?.followed_user_posts) continue;

        const data = {
          recipient_email: followerEmail,
          sender_email: authorEmail,
          sender_id: author?.id,
          type: 'new_post',
          post_id: postId,
          message: `${author?.full_name || 'Jemand'} hat einen neuen Post veröffentlicht`
        };

        await this.createNotification(data);
        await this.sendPushNotification(
          followerEmail,
          '📝 Neuer Post',
          data.message,
          `/Post?id=${postId}`
        );
      }
    } catch (error) {
      console.error('Error in notifyNewPost:', error);
    }
  }

  async notifyMessage(conversationId, senderEmail, recipientEmail, messagePreview) {
    if (senderEmail === recipientEmail) return;

    try {
      const users = await this.getUserLookup([senderEmail, recipientEmail]);
      const sender = users[senderEmail] || users[senderEmail?.toLowerCase()];
      const recipient = users[recipientEmail] || users[recipientEmail?.toLowerCase()];

      if (!recipient?.notification_settings?.messages) return;

      const data = {
        recipient_email: recipientEmail,
        sender_email: senderEmail,
        sender_id: sender?.id,
        type: 'message',
        conversation_id: conversationId,
        message: `${sender?.full_name || 'Jemand'}: ${messagePreview}`
      };

      await this.createNotification(data);
      await this.sendPushNotification(
        recipientEmail,
        '💬 Neue Nachricht',
        data.message,
        `/Messages?conv=${conversationId}`
      );
    } catch (error) {
      console.error('Error in notifyMessage:', error);
    }
  }

  // Check for mentions in content
  findMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }
}

export const notificationService = new NotificationService();
