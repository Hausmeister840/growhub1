/**
 * 🔌 TYPE-SAFE API CLIENT
 * Wrapper around base44 SDK
 */

import { base44 } from '@/api/base44Client';

class ApiClient {
  // ==================== POSTS ====================
  
  /**
   * Get list of posts
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getPosts(limit = 20) {
    try {
      const posts = await base44.entities.Post.list('-created_date', limit);
      return posts;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw error;
    }
  }

  /**
   * Get single post by ID
   * @param {string} postId
   * @returns {Promise<Object|null>}
   */
  async getPost(postId) {
    try {
      const posts = await base44.entities.Post.filter({ id: postId });
      return posts[0] || null;
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }
  }

  /**
   * Create new post
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createPost(data) {
    try {
      const response = await base44.functions.invoke('createPost', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  /**
   * Update post
   * @param {string} postId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updatePost(postId, data) {
    try {
      const updated = await base44.entities.Post.update(postId, data);
      return updated;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  /**
   * Delete post
   * @param {string} postId
   * @returns {Promise<void>}
   */
  async deletePost(postId) {
    try {
      await base44.entities.Post.delete(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }

  // ==================== USERS ====================
  
  /**
   * Get user by ID
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getUser(userId) {
    try {
      const users = await base44.entities.User.filter({ id: userId });
      return users[0] || null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    try {
      const user = await base44.auth.me();
      return user;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  /**
   * Update current user
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateCurrentUser(data) {
    try {
      const updated = await base44.auth.updateMe(data);
      return updated;
    } catch (error) {
      console.error('Failed to update current user:', error);
      throw error;
    }
  }

  // ==================== COMMENTS ====================
  
  /**
   * Get comments for a post
   * @param {string} postId
   * @returns {Promise<Array>}
   */
  async getComments(postId) {
    try {
      const comments = await base44.entities.Comment.filter(
        { post_id: postId }, 
        '-created_date', 
        100
      );
      return comments;
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  }

  /**
   * Create comment
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createComment(data) {
    try {
      const comment = await base44.entities.Comment.create(data);
      return comment;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  // ==================== GROW DIARIES ====================
  
  /**
   * Get grow diaries
   * @param {string} [userEmail]
   * @returns {Promise<Array>}
   */
  async getDiaries(userEmail) {
    try {
      const filter = userEmail ? { created_by: userEmail } : {};
      const diaries = await base44.entities.GrowDiary.filter(filter, '-created_date', 50);
      return diaries;
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
      return [];
    }
  }

  /**
   * Get single diary
   * @param {string} diaryId
   * @returns {Promise<Object|null>}
   */
  async getDiary(diaryId) {
    try {
      const diaries = await base44.entities.GrowDiary.filter({ id: diaryId });
      return diaries[0] || null;
    } catch (error) {
      console.error('Failed to fetch diary:', error);
      return null;
    }
  }

  /**
   * Create diary
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createDiary(data) {
    try {
      const diary = await base44.entities.GrowDiary.create(data);
      return diary;
    } catch (error) {
      console.error('Failed to create diary:', error);
      throw error;
    }
  }

  /**
   * Update diary
   * @param {string} diaryId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateDiary(diaryId, data) {
    try {
      const updated = await base44.entities.GrowDiary.update(diaryId, data);
      return updated;
    } catch (error) {
      console.error('Failed to update diary:', error);
      throw error;
    }
  }

  // ==================== GROW DIARY ENTRIES ====================
  
  /**
   * Get diary entries
   * @param {string} diaryId
   * @returns {Promise<Array>}
   */
  async getDiaryEntries(diaryId) {
    try {
      const entries = await base44.entities.GrowDiaryEntry.filter(
        { diary_id: diaryId },
        'day_number',
        500
      );
      return entries;
    } catch (error) {
      console.error('Failed to fetch diary entries:', error);
      return [];
    }
  }

  /**
   * Create diary entry
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createDiaryEntry(data) {
    try {
      const entry = await base44.entities.GrowDiaryEntry.create(data);
      return entry;
    } catch (error) {
      console.error('Failed to create diary entry:', error);
      throw error;
    }
  }

  // ==================== PRODUCTS ====================
  
  /**
   * Get products
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  async getProducts(filter = {}) {
    try {
      const products = await base44.entities.Product.filter(filter, '-created_date', 50);
      return products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Get single product
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async getProduct(productId) {
    try {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0] || null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  // ==================== CONVERSATIONS & MESSAGES ====================
  
  /**
   * Get conversations
   * @returns {Promise<Array>}
   */
  async getConversations() {
    try {
      const conversations = await base44.entities.Conversation.list('-last_message_timestamp', 50);
      return conversations;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for conversation
   * @param {string} conversationId
   * @returns {Promise<Array>}
   */
  async getMessages(conversationId) {
    try {
      const messages = await base44.entities.Message.filter(
        { conversation_id: conversationId },
        'created_date',
        100
      );
      return messages;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  /**
   * Send message
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async sendMessage(data) {
    try {
      const message = await base44.entities.Message.create(data);
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;