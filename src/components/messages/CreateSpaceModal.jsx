
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Users, Search, Plus, Loader2, Crown } from 'lucide-react';
import { User } from '@/entities/User';
import { Space } from '@/entities/Space';
import { useToast } from '@/components/ui/toast';

export default function CreateSpaceModal({ currentUser, onClose, onSuccess }) {
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const { toast } = useToast();

  const loadRecentUsers = useCallback(async () => {
    try {
      const users = await User.list('-updated_date', 15);
      const filtered = users.filter(u => u.email !== currentUser.email);
      setRecentUsers(filtered.slice(0, 8));
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

  const toggleMember = (user) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === user.id);
      if (isSelected) {
        return prev.filter(m => m.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const createSpace = async () => {
    if (!spaceName.trim()) {
      toast.error('Bitte gib einen Namen für die Gruppe ein');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Bitte wähle mindestens ein Mitglied aus');
      return;
    }

    setIsCreating(true);
    try {
      const memberEmails = [currentUser.email, ...selectedMembers.map(m => m.email)];
      
      const space = await Space.create({
        name: spaceName.trim(),
        description: spaceDescription.trim() || undefined,
        member_emails: memberEmails,
        admin_emails: [currentUser.email],
        last_message_preview: '',
        last_message_timestamp: new Date().toISOString()
      });

      toast.success('Gruppe erstellt!');
      onSuccess(space);
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Fehler beim Erstellen der Gruppe');
    } finally {
      setIsCreating(false);
    }
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : recentUsers;
  const availableUsers = displayUsers.filter(user => 
    !selectedMembers.some(selected => selected.id === user.id)
  );

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Neue Gruppe erstellen
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

          <CardContent className="space-y-6">
            {/* Group Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Gruppenname *
                </label>
                <Input
                  type="text"
                  placeholder="z.B. Indoor Grower Deutschland"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                  maxLength={50}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {spaceName.length}/50 Zeichen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Beschreibung (optional)
                </label>
                <Textarea
                  placeholder="Beschreibe, worum es in dieser Gruppe geht..."
                  value={spaceDescription}
                  onChange={(e) => setSpaceDescription(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 h-20 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {spaceDescription.length}/200 Zeichen
                </p>
              </div>
            </div>

            {/* Member Search */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mitglieder hinzufügen *
              </label>
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
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">
                  Ausgewählte Mitglieder ({selectedMembers.length})
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-800/50 rounded-lg p-3">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-white">
                          {member.full_name || member.email.split('@')[0]}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMember(member)}
                        className="text-zinc-400 hover:text-red-400 h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchQuery.length < 2 && recentUsers.length > 0 && (
                <p className="text-sm text-zinc-400 mb-2">Kürzlich aktive Nutzer:</p>
              )}
              
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                  {searchQuery.length >= 2 ? (
                    <p>Keine weiteren Nutzer gefunden</p>
                  ) : (
                    <p>Keine verfügbaren Nutzer</p>
                  )}
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user)}
                    className="p-3 rounded-lg cursor-pointer transition-all border bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500/50"
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
                        <Plus className="w-4 h-4 text-zinc-400" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Admin Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Admin-Rechte</span>
              </div>
              <p className="text-xs text-zinc-300">
                Du wirst automatisch als Administrator der Gruppe festgelegt und kannst später weitere Admins ernennen.
              </p>
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
                onClick={createSpace}
                disabled={!spaceName.trim() || selectedMembers.length === 0 || isCreating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Gruppe erstellen
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
