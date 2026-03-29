import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import UserCard from './UserCard';

export default function FollowersFollowingSection({ userId, type = 'followers', currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        // Get the target user first
        const targetResults = await base44.entities.User.filter({ id: userId });
        const targetUser = targetResults?.[0];
        
        if (!targetUser) {
          setUsers([]);
          return;
        }

        const emailList = type === 'followers' 
          ? (targetUser.followers || [])
          : (targetUser.following || []);

        if (emailList.length === 0) {
          setUsers([]);
          return;
        }

        // Load all users and filter (can't filter by array membership)
        const allUsers = await base44.entities.User.list('-created_date', 200);
        const usersList = allUsers.filter(u => emailList.includes(u.email));
        setUsers(usersList);
      } catch (error) {
        console.error('Load users error:', error);
        toast.error('Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [userId, type]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
        <p className="text-zinc-500">
          {type === 'followers' ? 'Noch keine Follower' : 'Folgt niemandem'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user, idx) => (
        <UserCard key={user.id} user={user} currentUser={currentUser} index={idx} />
      ))}
    </div>
  );
}