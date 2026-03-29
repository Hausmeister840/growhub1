import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StoriesBar({ currentUser, onStoryClick, onCreateStory }) {
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState({});

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      // Only load stories first — skip if none exist
      const allStories = await base44.entities.Story.list('-created_date', 20).catch(() => []);

      const now = new Date();
      const active = (allStories || []).filter(s => {
        if (!s || !s.expires_at) return false;
        return new Date(s.expires_at) > now;
      });

      // Only load users if there are active stories
      let userMap = {};
      if (active.length > 0) {
        const authorEmails = [...new Set(active.map(s => s.created_by).filter(Boolean))];
        const allUsers = await base44.entities.User.list('-created_date', 50).catch(() => []);
        const emailSet = new Set(authorEmails.map(e => e.toLowerCase()));
        (allUsers || []).forEach(u => {
          if (u?.email && emailSet.has(u.email.toLowerCase())) userMap[u.email] = u;
        });
      }

      const grouped = {};
      active.forEach(story => {
        const email = story.created_by;
        if (!email) return;
        if (!grouped[email]) grouped[email] = [];
        grouped[email].push(story);
      });

      setStories(grouped);
      setUsers(userMap);
    } catch (error) {
      console.error('Stories load error:', error);
      setStories({});
      setUsers({});
    }
  };

  const userStories = Object.keys(stories);

  return (
    <div className="flex gap-4 overflow-x-auto hide-scrollbar py-5 px-4">
      {/* Create Story */}
      <Link
        to={createPageUrl('CreateStory')}
        className="flex-shrink-0 flex flex-col items-center gap-2.5 group"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-zinc-700/50 group-hover:border-green-500/50 transition-all overflow-hidden shadow-lg">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">
                {currentUser?.full_name?.[0] || '?'}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center border-2 border-black shadow-lg">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </motion.div>
        <span className="text-xs text-zinc-500 font-medium">Story</span>
      </Link>

      {/* Other Stories */}
      {userStories.map(email => {
        const user = users[email];
        const userStoryList = stories[email];
        const hasViewed = userStoryList.every(s => s.views?.includes(currentUser?.email));

        return (
          <motion.button
            key={email}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStoryClick(email, userStoryList)}
            className="flex-shrink-0 flex flex-col items-center gap-2.5"
          >
            <div className={`w-[76px] h-[76px] rounded-2xl p-[3px] shadow-lg ${
              hasViewed 
                ? 'bg-zinc-700/50' 
                : 'bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500'
            }`}>
              <div className="w-full h-full rounded-xl bg-black p-[2px] overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-white font-bold text-lg">
                    {user?.full_name?.[0] || email[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-zinc-400 font-medium max-w-[72px] truncate">
              {user?.username || email.split('@')[0]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}