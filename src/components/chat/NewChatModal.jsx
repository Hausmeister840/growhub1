import { useState, useEffect } from 'react';
import { Search, Loader2, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Drawer as DrawerPrimitive } from 'vaul';
import { mergeUsers, searchDirectoryUsers } from '@/api/userDirectory';

export default function NewChatModal({ isOpen, onClose, currentUser, allUsers: externalUsers, onCreateConversation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [localUsers, setLocalUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const delay = searchQuery.trim() ? 180 : 0;

    setLocalUsers((prev) => mergeUsers(prev, externalUsers || []));
    setIsLoadingUsers(true);

    const timer = window.setTimeout(async () => {
      try {
        const directoryUsers = await searchDirectoryUsers(searchQuery, {
          limit: searchQuery.trim() ? 50 : 30,
        });

        if (!active) return;
        setLocalUsers(mergeUsers(externalUsers || [], directoryUsers));
      } catch {
        if (active) {
          setLocalUsers(mergeUsers(externalUsers || []));
        }
      } finally {
        if (active) {
          setIsLoadingUsers(false);
        }
      }
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, externalUsers, searchQuery]);

  if (!isOpen) return null;

  const allUsers = mergeUsers(externalUsers || [], localUsers);

  const filteredUsers = allUsers.filter(u => {
    if (u.id === currentUser?.id) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (selectedUsers.length === 0) { toast.error('Wähle mindestens einen Nutzer aus'); return; }
    setIsCreating(true);
    try {
      const participants = [currentUser.id, ...selectedUsers];
      const isGroup = selectedUsers.length > 1;
      
      if (!isGroup) {
        // Check existing conversations from allUsers (already loaded, no extra fetch)
        const existingConvos = await base44.entities.Conversation.filter(
          { type: 'direct', participants: selectedUsers[0] },
          '-updated_date',
          10
        );
        const existing = (existingConvos || []).find(c => 
          c.participants?.length === 2 && 
          c.participants.includes(currentUser.id) && 
          c.participants.includes(selectedUsers[0])
        );
        if (existing) { 
          onCreateConversation(existing); 
          toast.success('Chat geöffnet!'); 
          setIsCreating(false); 
          return; 
        }
      }
      
      const conversation = await base44.entities.Conversation.create({
        type: isGroup ? 'group' : 'direct', 
        participants,
        name: isGroup ? 'Neue Gruppe' : null, 
        admins: isGroup ? [currentUser.id] : [],
        unreadCount: Object.fromEntries(participants.map(id => [id, 0])),
        isPinned: {}, isMuted: {}, isArchived: {},
      });
      onCreateConversation(conversation);
      toast.success(isGroup ? 'Gruppe erstellt!' : 'Chat gestartet!');
    } catch (err) {
      console.error('Create conversation failed:', err);
      toast.error('Fehler beim Erstellen');
    } finally { setIsCreating(false); }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const getDisplayName = (u) => u.full_name || u.username || u.email?.split('@')[0] || 'Nutzer';
  const getHandle = (u) => u.username || u.email?.split('@')[0] || '';

  return (
    <DrawerPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" />
        <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-3xl bg-zinc-950 border-t border-zinc-800/60 outline-none max-h-[85vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="px-5 py-2">
            <DrawerPrimitive.Title className="text-lg font-bold text-white">Neue Nachricht</DrawerPrimitive.Title>
          </div>

          {/* Search */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nutzer suchen..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl text-white text-sm placeholder-zinc-500 focus:border-green-500/50 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="px-5 pb-2 flex flex-wrap gap-2">
              {selectedUsers.map(uid => {
                const u = allUsers.find(usr => usr.id === uid);
                if (!u) return null;
                return (
                  <motion.span
                    key={uid}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 border border-green-500/30 rounded-xl text-xs font-medium text-green-300"
                  >
                    {getDisplayName(u)}
                    <button onClick={() => toggleUser(uid)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-4" />

          {/* User List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
            {isLoadingUsers && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
              </div>
            )}
            {!isLoadingUsers && filteredUsers.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">
                {searchQuery ? 'Keine Nutzer gefunden' : 'Keine Nutzer verfügbar'}
              </div>
            )}
            {filteredUsers.map(user => {
              const isSelected = selectedUsers.includes(user.id);
              const dName = getDisplayName(user);
              const handle = getHandle(user);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`w-full p-3 flex items-center gap-3.5 rounded-2xl transition-all duration-150 ${
                    isSelected ? 'bg-green-500/10' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={dName} className="w-11 h-11 rounded-xl object-cover ring-[1.5px] ring-white/[0.06]" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500/80 to-emerald-600/80 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{dName[0]?.toUpperCase() || '?'}</span>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-white text-[14px] truncate">{dName}</p>
                    {handle && <p className="text-[12px] text-zinc-500 truncate">@{handle}</p>}
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-green-500 shadow-sm shadow-green-500/30' : 'border-2 border-zinc-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={selectedUsers.length === 0 || isCreating}
              className="w-full py-3.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-black font-bold text-sm transition-colors shadow-lg shadow-green-500/20"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-black" />
              ) : (
                selectedUsers.length > 1 ? 'Gruppe erstellen' : 'Chat starten'
              )}
            </motion.button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
