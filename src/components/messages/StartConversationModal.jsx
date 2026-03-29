import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Users as UsersIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function StartConversationModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onStartConversation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isGroupMode = selectedUsers.length > 1;

  const availableUsers = useMemo(() => {
    return users.filter(u => u.email !== currentUser?.email);
  }, [users, currentUser]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(u => 
      u.full_name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  const toggleUser = (userEmail) => {
    setSelectedUsers(prev => 
      prev.includes(userEmail)
        ? prev.filter(e => e !== userEmail)
        : [...prev, userEmail]
    );
  };

  const handleStart = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Wähle mindestens einen Nutzer aus');
      return;
    }

    if (isGroupMode && !groupName.trim()) {
      toast.error('Gib einen Gruppennamen ein');
      return;
    }

    setIsCreating(true);

    try {
      await onStartConversation(selectedUsers, isGroupMode ? groupName : null);
      setSelectedUsers([]);
      setGroupName('');
      setSearchQuery('');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Erstellen der Unterhaltung');
    } finally {
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Close on route change
  React.useEffect(() => {
    const handleRouteChange = () => {
      onClose();
    };
    
    window.addEventListener('routeChange', handleRouteChange);
    return () => window.removeEventListener('routeChange', handleRouteChange);
  }, [onClose]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[80vh] bg-zinc-950 rounded-3xl border border-zinc-800 flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-white">Neue Unterhaltung</h2>
              <p className="text-sm text-zinc-500 mt-1">
                {selectedUsers.length === 0 
                  ? 'Wähle Teilnehmer aus'
                  : `${selectedUsers.length} ausgewählt`}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nutzer suchen..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* Selected Users Preview */}
          {selectedUsers.length > 0 && (
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/30">
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(email => {
                  const user = users.find(u => u.email === email);
                  return (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full"
                    >
                      <span className="text-sm text-green-400">
                        {user?.full_name || user?.username || email.split('@')[0]}
                      </span>
                      <button
                        onClick={() => toggleUser(email)}
                        className="text-green-500 hover:text-green-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group Name Input */}
          {isGroupMode && (
            <div className="px-6 py-4 border-b border-zinc-800">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Gruppenname eingeben..."
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          )}

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-zinc-500 text-sm">
                  {searchQuery ? 'Keine Nutzer gefunden' : 'Keine verfügbaren Nutzer'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user, idx) => {
                  const isSelected = selectedUsers.includes(user.email);
                  
                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => toggleUser(user.email)}
                      className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                          {user.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}

                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          @{user.username || user.email?.split('@')[0]}
                        </p>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'border-zinc-700'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-black" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-950">
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleStart}
                disabled={selectedUsers.length === 0 || isCreating || (isGroupMode && !groupName.trim())}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    {isGroupMode ? (
                      <>
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Gruppe erstellen
                      </>
                    ) : (
                      'Chat starten'
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}