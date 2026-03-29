import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, MessageCircle, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useChatStore from '@/components/chat/useChatStore';
import ConversationList from '@/components/chat/ConversationList';
import ChatView from '@/components/chat/ChatView';
import NewChatModal from '@/components/chat/NewChatModal';

const FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'unread', label: 'Ungelesen' },
  { id: 'direct', label: 'Direkt' },
  { id: 'groups', label: 'Gruppen' },
];

export default function Messages() {
  const location = useLocation();
  const deepLinkHandledRef = useRef(false);

  const {
    currentUser, conversations, allUsers, userMap,
    isLoading, loadError, refetchConversations, totalUnread,
    getOtherParticipant, findExistingDirectChat, findOrFetchUser,
    addConversation, updateConversation,
  } = useChatStore();
  const reduceMotion = useReducedMotion();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showNewChat, setShowNewChat] = useState(false);

  // Handle deep links
  useEffect(() => {
    let cancelled = false;

    if (deepLinkHandledRef.current) return;
    if (!currentUser?.id || isLoading) return;

    const params = new URLSearchParams(location.search);
    const convParam = params.get('conv');
    const userParam = params.get('user');

    if (!convParam && !userParam) return;
    deepLinkHandledRef.current = true;

    if (convParam) {
      setSelectedChatId(convParam);
      window.history.replaceState({}, '', '/Messages');
      return;
    }

    if (userParam) {
      (async () => {
        const target = await findOrFetchUser(userParam);
        if (cancelled) return;

        if (!target) {
          toast.error('Nutzer nicht gefunden');
          window.history.replaceState({}, '', '/Messages');
          return;
        }

        const existing = findExistingDirectChat(target.id);
        if (existing) {
          setSelectedChatId(existing.id);
        } else {
          const participants = [currentUser.id, target.id];
          base44.entities.Conversation.create({
            type: 'direct', participants, admins: [],
            unreadCount: Object.fromEntries(participants.map(id => [id, 0])),
            isPinned: {}, isMuted: {}, isArchived: {},
          }).then(conv => {
            if (cancelled) return;
            addConversation(conv);
            setSelectedChatId(conv.id);
          }).catch(() => {
            if (!cancelled) {
              toast.error('Chat konnte nicht erstellt werden');
            }
          });
        }

        window.history.replaceState({}, '', '/Messages');
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [location.search, currentUser?.id, isLoading, findExistingDirectChat, findOrFetchUser, addConversation]);

  const filteredConversations = useMemo(() => {
    return conversations
      .filter(conv => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const other = getOtherParticipant(conv);
          const nameMatch = conv.name?.toLowerCase().includes(q);
          const userMatch = other && (other.full_name?.toLowerCase().includes(q) || other.username?.toLowerCase().includes(q));
          const msgMatch = conv.lastMessage?.content?.toLowerCase().includes(q);
          if (!nameMatch && !userMatch && !msgMatch) return false;
        }
        const unread = conv.unreadCount?.[currentUser?.id] || 0;
        if (filter === 'unread' && unread === 0) return false;
        if (filter === 'groups' && conv.type === 'direct') return false;
        if (filter === 'direct' && conv.type !== 'direct') return false;
        return true;
      })
      .sort((a, b) => {
        const ap = a.isPinned?.[currentUser?.id] || false;
        const bp = b.isPinned?.[currentUser?.id] || false;
        if (ap && !bp) return -1;
        if (!ap && bp) return 1;
        return new Date(b.lastMessage?.timestamp || b.updated_date || 0) - new Date(a.lastMessage?.timestamp || a.updated_date || 0);
      });
  }, [conversations, searchQuery, filter, currentUser?.id, getOtherParticipant]);

  if (!currentUser && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-52px-64px)] lg:h-[100svh] bg-black">
      {/* Sidebar */}
      <div className={`w-full md:w-[360px] lg:w-[400px] flex-shrink-0 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-extrabold text-white tracking-tight">Chats</h1>
              {totalUnread > 0 && (
                <motion.span
                  initial={reduceMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={reduceMotion ? { duration: 0 } : undefined}
                  className="min-w-[22px] h-[22px] px-1.5 bg-green-500 text-black text-[11px] font-bold rounded-full flex items-center justify-center"
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </motion.span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNewChat(true)}
              className="w-10 h-10 flex items-center justify-center bg-green-500 hover:bg-green-400 text-black rounded-2xl transition-colors shadow-lg shadow-green-500/20"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Search */}
          <div className={`relative mb-4 transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-green-400' : 'text-zinc-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Suchen..."
              className={`w-full pl-10 pr-4 py-3 bg-zinc-900/80 border rounded-2xl text-white text-sm placeholder-zinc-500 transition-all duration-200 outline-none ${
                searchFocused ? 'border-green-500/50 bg-zinc-900 shadow-lg shadow-green-500/5' : 'border-zinc-800/60'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-zinc-700 hover:bg-zinc-600">
                <X className="w-3 h-3 text-zinc-300" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {FILTERS.map(tab => {
              const isActive = filter === tab.id;
              const count = tab.id === 'unread' ? conversations.filter(c => (c.unreadCount?.[currentUser?.id] || 0) > 0).length : null;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                  {count > 0 && !isActive && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-green-500 text-black text-[9px] font-bold rounded-full">
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-4 mt-1" />

        {loadError && (
          <div className="mx-4 mt-2 mb-1 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-amber-100">{loadError}</p>
            <button
              type="button"
              onClick={() => refetchConversations()}
              className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          isLoading={false}
          selectedId={selectedChatId}
          currentUser={currentUser}
          allUsers={allUsers}
          onSelect={setSelectedChatId}
          totalCount={conversations.length}
          filterActive={Boolean(searchQuery.trim() || filter !== 'all')}
        />
      </div>

      {/* Desktop divider */}
      <div className="hidden md:block w-px bg-zinc-800/60" />

      {/* Chat Panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedChatId ? (
          <ChatView
            key={selectedChatId}
            conversationId={selectedChatId}
            currentUser={currentUser}
            allUsers={allUsers}
            userMap={userMap}
            conversations={conversations}
            updateConversation={updateConversation}
            onBack={() => setSelectedChatId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8 bg-black">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5 }}
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-500/10 rounded-3xl blur-xl" />
                <div className="relative w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800">
                  <MessageCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Deine Nachrichten</h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
                Wähle einen Chat aus oder starte eine neue Unterhaltung mit deiner Community
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChat(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-500 hover:bg-green-400 text-black font-bold text-sm rounded-2xl transition-colors shadow-lg shadow-green-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Neuen Chat starten
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            isOpen={showNewChat}
            onClose={() => setShowNewChat(false)}
            currentUser={currentUser}
            allUsers={allUsers}
            onCreateConversation={(conv) => {
              setShowNewChat(false);
              addConversation(conv);
              setSelectedChatId(conv.id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
