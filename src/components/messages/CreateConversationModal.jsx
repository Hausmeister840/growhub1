
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, UserPlus, Loader2, Users } from 'lucide-react';
import { User } from '@/entities/User';
import { Conversation } from '@/entities/Conversation';
import { useToast } from '@/components/ui/toast';

export default function CreateConversationModal({ currentUser, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const { toast } = useToast();

  const loadRecentUsers = useCallback(async () => {
    try {
      // Load users who have been active recently
      const users = await User.list('-updated_date', 10);
      const filtered = users.filter(u => u.email !== currentUser.email);
      setRecentUsers(filtered.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  }, [currentUser.email]);

  useEffect(() => {
    loadRecentUsers();
  }, [loadRecentUsers]);

  const searchUsers = useCallback(async () => {
    setIsSearching(true);
    try {
      // Search by username, full name, or email
      const users = await User.filter({
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { full_name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      });
      
      const filtered = users.filter(u => u.email !== currentUser.email);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Fehler bei der Suche');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, currentUser.email, toast]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const createConversation = async () => {
    if (!selectedUser) return;

    setIsCreating(true);
    try {
      // Check if conversation already exists
      const existingConversations = await Conversation.filter({
        participant_emails: { $all: [currentUser.email, selectedUser.email] }
      });

      if (existingConversations.length > 0) {
        toast.info('Unterhaltung existiert bereits');
        onSuccess(existingConversations[0]);
        return;
      }

      // Create new conversation
      const conversation = await Conversation.create({
        participant_emails: [currentUser.email, selectedUser.email],
        last_message_preview: '',
        last_message_timestamp: new Date().toISOString()
      });

      toast.success('Unterhaltung erstellt!');
      onSuccess(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Fehler beim Erstellen der Unterhaltung');
    } finally {
      setIsCreating(false);
    }
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : recentUsers;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-500" />
                Neue Unterhaltung
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              <Input
                type="text"
                placeholder="Nutzer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-zinc-500" />
              )}
            </div>

            {/* Selected User */}
            {selectedUser && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {selectedUser.full_name || selectedUser.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-zinc-400">@{selectedUser.username || selectedUser.email.split('@')[0]}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedUser(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* User List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchQuery.length < 2 && recentUsers.length > 0 && (
                <p className="text-sm text-zinc-400 mb-2">Kürzlich aktive Nutzer:</p>
              )}
              
              {displayUsers.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  {searchQuery.length >= 2 ? (
                    <p>Keine Nutzer gefunden</p>
                  ) : (
                    <p>Keine aktiven Nutzer</p>
                  )}
                </div>
              ) : (
                displayUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedUser?.id === user.id
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <p className="text-sm text-zinc-400 truncate">
                          @{user.username || user.email.split('@')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.verified && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            Verifiziert
                          </Badge>
                        )}
                        {user.grow_level && user.grow_level !== 'beginner' && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            {user.grow_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Abbrechen
              </Button>
              <Button
                onClick={createConversation}
                disabled={!selectedUser || isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Unterhaltung starten
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
