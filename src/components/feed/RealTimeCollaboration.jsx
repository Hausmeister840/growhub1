import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

export default function RealTimeCollaboration({ post, currentUser }) {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const simulateViewers = () => {
      const count = Math.floor(Math.random() * 5);
      const viewers = Array.from({ length: count }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        isEditing: Math.random() > 0.7
      }));
      setActiveUsers(viewers);
    };

    simulateViewers();
    const interval = setInterval(simulateViewers, 5000);

    return () => clearInterval(interval);
  }, [post]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl">
      <Eye className="w-3.5 h-3.5 text-blue-400" />
      
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 3).map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="relative"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full border-2 border-zinc-900"
            />
            {user.isEditing && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-zinc-900" />
            )}
          </motion.div>
        ))}
      </div>

      {activeUsers.length > 3 && (
        <span className="text-[10px] text-zinc-400">
          +{activeUsers.length - 3}
        </span>
      )}
    </div>
  );
}