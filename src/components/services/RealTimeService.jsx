import { base44 } from '@/api/base44Client';

class RealTimeService {
  constructor() {
    this.listeners = {};
    this.isActive = false;
    this.lastCheck = null;
    this.checkInterval = null;
    this.isTabVisible = true;
    this.activeInterval = 30000;
    this.inactiveInterval = 120000;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isTabVisible = !document.hidden;
        if (this.isTabVisible && this.isActive) {
          this.checkForUpdates();
        }
      });
    }
  }

  subscribe(channel, callback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);

    return () => {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
      if (this.listeners[channel].length === 0) {
        delete this.listeners[channel];
      }
    };
  }

  emit(channel, data) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Silent error handling
        }
      });
    }
  }

  async fetchLatestData() {
    try {
      const [rawPosts, users] = await Promise.all([
        base44.entities.Post.list('-created_date', 50),
        base44.entities.User.list()
      ]);

      const posts = (rawPosts || []).map(post => {
        if (!post) return null;
        
        if (post.data && typeof post.data === 'object') {
          return {
            ...post.data,
            id: post.id,
            created_date: post.created_date,
            updated_date: post.updated_date,
            created_by: post.created_by,
            created_by_id: post.created_by_id
          };
        }
        
        return post;
      }).filter(p => p && p.status === 'published');

      const userMap = {};
      (users || []).forEach(user => {
        if (user?.email) {
          userMap[user.email] = user;
        }
      });

      return { posts, users: userMap };
    } catch (error) {
      return { posts: [], users: {} };
    }
  }

  async checkForUpdates() {
    if (!this.isActive) return;

    try {
      const { posts, users } = await this.fetchLatestData();
      const now = new Date();

      if (!this.lastCheck) {
        this.lastCheck = now;
        this.scheduleNextCheck();
        return;
      }

      const newPosts = posts.filter(post => {
        const postDate = new Date(post.created_date);
        return postDate > this.lastCheck;
      });

      if (newPosts.length > 0) {
        const newItems = newPosts.map(post => ({
          post,
          user: users[post.created_by]
        }));
        
        this.emit('feed:new_posts', newItems);
      }

      const updatedPosts = posts.filter(post => {
        const updateDate = new Date(post.updated_date);
        return updateDate > this.lastCheck;
      });

      if (updatedPosts.length > 0) {
        this.emit('feed:updates', updatedPosts);
      }

      this.lastCheck = now;
    } catch (error) {
      // Silent error handling
    }

    this.scheduleNextCheck();
  }

  scheduleNextCheck() {
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
    }

    const interval = this.isTabVisible ? this.activeInterval : this.inactiveInterval;
    
    this.checkInterval = setTimeout(() => {
      this.checkForUpdates();
    }, interval);
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastCheck = new Date();
    this.scheduleNextCheck();
  }

  stop() {
    this.isActive = false;
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }
  }

  destroy() {
    this.stop();
    this.listeners = {};
  }

  /** Optional presence hook (e.g. Supabase); safe no-op if not wired. */
  trackPresence(_userId, _displayName, _avatarUrl) {}
}

const realTimeService = new RealTimeService();
export default realTimeService;