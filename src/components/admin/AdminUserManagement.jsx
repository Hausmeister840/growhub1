import { useState, useEffect, useMemo } from "react";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Ban, Trash2, CheckCircle, XCircle, Mail, Calendar,
  Shield, Eye, MessageSquare, TrendingUp,
  X, UserPlus, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [userPosts, setUserPosts] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState("created_date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [allUsers, allPosts] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Post.list('-created_date', 1000)
      ]);

      const postsMap = {};
      (allPosts || []).forEach(post => {
        if (post?.created_by) {
          if (!postsMap[post.created_by]) {
            postsMap[post.created_by] = [];
          }
          postsMap[post.created_by].push(post);
        }
      });

      setUsers(allUsers || []);
      setUserPosts(postsMap);
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Fehler beim Laden der Nutzer");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus === "banned") {
      result = result.filter(u => u.is_banned);
    } else if (filterStatus === "admin") {
      result = result.filter(u => u.role === 'admin');
    } else if (filterStatus === "active") {
      result = result.filter(u => !u.is_banned);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "created_date") {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === "name") {
        return (a.full_name || '').localeCompare(b.full_name || '');
      } else if (sortBy === "posts") {
        return (userPosts[b.email]?.length || 0) - (userPosts[a.email]?.length || 0);
      } else if (sortBy === "xp") {
        return (b.xp || 0) - (a.xp || 0);
      }
      return 0;
    });

    return result;
  }, [users, searchQuery, sortBy, filterStatus, userPosts]);

  const handleBanUser = async (userId, isBanned) => {
    try {
      await base44.entities.User.update(userId, { is_banned: !isBanned });
      toast.success(isBanned ? "Nutzer entsperrt" : "Nutzer gesperrt");
      loadUsers();
    } catch (error) {
      console.error('Ban user error:', error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Nutzer "${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      await base44.entities.User.delete(userId);
      toast.success("Nutzer gelöscht");
      loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const handleMakeAdmin = async (userId, isAdmin) => {
    try {
      await base44.entities.User.update(userId, { role: isAdmin ? 'user' : 'admin' });
      toast.success(isAdmin ? "Admin-Rechte entfernt" : "Admin-Rechte gewährt");
      loadUsers();
    } catch (error) {
      console.error('Update role error:', error);
      toast.error("Aktion fehlgeschlagen");
    }
  };

  const handleBatchBan = async () => {
    if (selectedUsers.size === 0) return;
    if (!window.confirm(`${selectedUsers.size} Nutzer sperren?`)) return;

    try {
      await Promise.all(
        Array.from(selectedUsers).map(userId => 
          base44.entities.User.update(userId, { is_banned: true })
        )
      );
      toast.success(`${selectedUsers.size} Nutzer gesperrt`);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      console.error('Batch ban error:', error);
      toast.error("Batch-Aktion fehlgeschlagen");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Nutzer suchen (Name, Email, Username)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-zinc-800 border-zinc-700 text-white h-12"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterStatus("all")}
              variant={filterStatus === "all" ? "default" : "outline"}
              className={filterStatus === "all" ? "bg-green-600" : "border-zinc-700"}
            >
              Alle ({users.length})
            </Button>
            <Button
              onClick={() => setFilterStatus("active")}
              variant={filterStatus === "active" ? "default" : "outline"}
              className={filterStatus === "active" ? "bg-blue-600" : "border-zinc-700"}
            >
              Aktiv ({users.filter(u => !u.is_banned).length})
            </Button>
            <Button
              onClick={() => setFilterStatus("banned")}
              variant={filterStatus === "banned" ? "default" : "outline"}
              className={filterStatus === "banned" ? "bg-red-600" : "border-zinc-700"}
            >
              Gesperrt ({users.filter(u => u.is_banned).length})
            </Button>
            <Button
              onClick={() => setFilterStatus("admin")}
              variant={filterStatus === "admin" ? "default" : "outline"}
              className={filterStatus === "admin" ? "bg-purple-600" : "border-zinc-700"}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admins ({users.filter(u => u.role === 'admin').length})
            </Button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-12 px-4 bg-zinc-800 border border-zinc-700 text-white rounded-xl"
          >
            <option value="created_date">Neueste zuerst</option>
            <option value="name">Name A-Z</option>
            <option value="posts">Meiste Posts</option>
            <option value="xp">Meiste XP</option>
          </select>
        </div>

        {/* Batch Actions */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl"
          >
            <p className="text-white font-medium">{selectedUsers.size} ausgewählt</p>
            <Button
              onClick={handleBatchBan}
              className="bg-red-600 hover:bg-red-700"
            >
              Alle sperren
            </Button>
            <Button
              onClick={() => setSelectedUsers(new Set())}
              variant="outline"
              className="border-zinc-700"
            >
              Auswahl aufheben
            </Button>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-zinc-400">
        <span>Angezeigt: {filteredAndSortedUsers.length}</span>
      </div>

      {/* User List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedUsers.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            className={`bg-zinc-900/50 backdrop-blur-xl border rounded-3xl p-6 hover:border-zinc-700 transition-all ${
              selectedUsers.has(user.id) ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedUsers.has(user.id)}
                onChange={() => toggleUserSelection(user.id)}
                className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-green-500 focus:ring-green-500"
              />

              {/* Avatar */}
              <img
                src={user.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.email}`}
                alt={user.full_name}
                className="w-14 h-14 rounded-2xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedUser(user)}
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 
                    className="font-semibold text-white cursor-pointer hover:text-green-400 transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    {user.full_name}
                  </h3>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                  {user.is_banned && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Gesperrt
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(user.created_date), { addSuffix: true, locale: de })}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {userPosts[user.email]?.length || 0} Posts
                  </span>
                  <span className="flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    {user.followers_count || 0} Follower
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {user.xp || 0} XP
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                  className="border-zinc-700"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMakeAdmin(user.id, user.role === 'admin')}
                  className="border-zinc-700"
                >
                  {user.role === 'admin' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBanUser(user.id, user.is_banned)}
                  className={user.is_banned ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}
                >
                  {user.is_banned ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteUser(user.id, user.full_name)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Keine Nutzer gefunden</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Nutzer Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${selectedUser.email}`}
                    alt={selectedUser.full_name}
                    className="w-20 h-20 rounded-2xl"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedUser.full_name}</h3>
                    <p className="text-zinc-400">{selectedUser.email}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Beigetreten {formatDistanceToNow(new Date(selectedUser.created_date), { addSuffix: true, locale: de })}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{userPosts[selectedUser.email]?.length || 0}</p>
                    <p className="text-zinc-400 text-sm">Posts</p>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{selectedUser.followers_count || 0}</p>
                    <p className="text-zinc-400 text-sm">Follower</p>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-2xl font-bold text-white">{selectedUser.xp || 0}</p>
                    <p className="text-zinc-400 text-sm">XP</p>
                  </div>
                </div>

                {/* Recent Posts */}
                {userPosts[selectedUser.email] && userPosts[selectedUser.email].length > 0 && (
                  <div>
                    <h4 className="font-bold text-white mb-3">Letzte Posts</h4>
                    <div className="space-y-2">
                      {userPosts[selectedUser.email].slice(0, 3).map(post => (
                        <div key={post.id} className="bg-zinc-800 rounded-2xl p-4">
                          <p className="text-zinc-200 text-sm">{post.content}</p>
                          <p className="text-zinc-500 text-xs mt-2">
                            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: de })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleMakeAdmin(selectedUser.id, selectedUser.role === 'admin')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {selectedUser.role === 'admin' ? 'Admin entfernen' : 'Admin machen'}
                  </Button>
                  <Button
                    onClick={() => {
                      handleBanUser(selectedUser.id, selectedUser.is_banned);
                      setSelectedUser(null);
                    }}
                    className={`flex-1 ${selectedUser.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {selectedUser.is_banned ? 'Entsperren' : 'Sperren'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}