import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export default function useFeed(activeTab = 'latest') {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [rawPosts, allUsers] = await Promise.all([
        base44.entities.Post.list('-created_date', 100),
        base44.entities.User.list()
      ]);

      // Flatten posts
      const allPosts = (rawPosts || []).map(post => {
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
      }).filter(p => p && p.id && p.status === 'published');

      // Create user map with proper mapping
      const userMap = {};
      (allUsers || []).forEach(user => {
        if (user?.email) {
          userMap[user.email] = {
            ...user,
            username: user.username || user.email?.split('@')[0] || 'user',
            full_name: user.full_name || (user.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : user.email?.split('@')[0] || 'User')
          };
        }
      });

      // Filter by tab
      let filtered = allPosts;
      if (activeTab === 'videos') {
        filtered = allPosts.filter(p => 
          p?.media_urls?.length > 0 && 
          p.media_urls.some(url => /\.(mp4|mov|webm|avi)$/i.test(url))
        );
      } else if (activeTab === 'trending') {
        filtered = allPosts.sort((a, b) => {
          const scoreA = (a.viral_score || 0) + (a.engagement_score || 0);
          const scoreB = (b.viral_score || 0) + (b.engagement_score || 0);
          return scoreB - scoreA;
        });
      }

      setPosts(filtered);
      setUsers(userMap);
    } catch (err) {
      console.error('Feed load error:', err);
      setError(err.message);
      setPosts([]);
      setUsers({});
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    users,
    isLoading,
    error,
    refresh: loadPosts
  };
}