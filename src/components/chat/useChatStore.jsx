import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  buildUserLookup,
  fetchUsersByIds,
  findUserByIdentifier as fetchUserByIdentifier,
  mergeUsers,
  normalizeUser,
  primeUserCache,
} from '@/api/userDirectory';

/**
 * Central chat state manager.
 * Single source of truth for conversations, users, and current user.
 * Avoids duplicate fetches and subscriptions across components.
 */

export default function useChatStore() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const userMap = useMemo(() => buildUserLookup(allUsers), [allUsers]);

  const syncConversationUsers = useCallback(async (conversationList, seedUsers = []) => {
    const participantIds = [...new Set(
      (conversationList || [])
        .flatMap((conversation) => conversation?.participants || [])
        .filter(Boolean)
    )];

    if (participantIds.length === 0 && seedUsers.length === 0) {
      return;
    }

    const fetchedUsers = participantIds.length > 0 ? await fetchUsersByIds(participantIds) : [];
    setAllUsers((prev) => mergeUsers(prev, seedUsers, fetchedUsers));
  }, []);

  // 1. Auth + initial data load (once)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;

        const normalizedCurrentUser = { ...user, ...normalizeUser(user) };
        primeUserCache([normalizedCurrentUser]);
        setCurrentUser(normalizedCurrentUser);
        setAllUsers((prev) => mergeUsers(prev, [normalizedCurrentUser]));

        const convos = await base44.entities.Conversation.list('-updated_date', 100);

        if (!active) return;
        setConversations(convos || []);
        await syncConversationUsers(convos || [], [normalizedCurrentUser]);
      } catch (err) {
        console.error('Chat store init error:', err);
        if (!active) return;
        base44.auth.redirectToLogin();
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [syncConversationUsers]);

  // 2. Subscribe to conversation changes (once currentUser is ready)
  useEffect(() => {
    if (!currentUser?.id) return;

    let unsubscribe = () => {};

    const subscribe = () => {
      try {
        unsubscribe();
        unsubscribe = base44.entities.Conversation.subscribe((event) => {
          const conv = event.data;
          if (event.type === 'create') {
            setConversations(prev => prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]);
            syncConversationUsers([conv]);
          } else if (event.type === 'update') {
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...conv } : c));
            syncConversationUsers([conv]);
          } else if (event.type === 'delete') {
            setConversations(prev => prev.filter(c => c.id !== event.id));
          }
        });
      } catch (e) {
        console.warn('Conversation subscribe failed:', e);
      }
    };

    subscribe();

    const onOnline = () => subscribe();
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
      try {
        unsubscribe();
      } catch (e) {
        console.warn('Conversation unsubscribe failed:', e);
      }
    };
  }, [currentUser?.id, syncConversationUsers]);

  // 3. Helpers
  const findUserById = useCallback((id) => userMap[id] || null, [userMap]);
  const findUserByEmail = useCallback((email) => {
    if (!email) return null;
    return userMap[email] || userMap[email.toLowerCase()] || null;
  }, [userMap]);

  const findOrFetchUser = useCallback(async (identifier) => {
    if (!identifier) return null;

    const cached = findUserById(identifier) || findUserByEmail(identifier);
    if (cached) return cached;

    const fetchedUser = await fetchUserByIdentifier(identifier);
    if (fetchedUser) {
      setAllUsers((prev) => mergeUsers(prev, [fetchedUser]));
    }

    return fetchedUser;
  }, [findUserByEmail, findUserById]);

  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation || conversation.type !== 'direct' || !currentUser?.id) return null;
    const otherId = (conversation.participants || []).find(id => id !== currentUser.id);
    return otherId ? findUserById(otherId) : null;
  }, [currentUser?.id, findUserById]);

  const findExistingDirectChat = useCallback((targetUserId) => {
    return conversations.find(c =>
      c.type === 'direct' &&
      c.participants?.length === 2 &&
      c.participants.includes(targetUserId)
    );
  }, [conversations]);

  const addConversation = useCallback((conv) => {
    setConversations(prev => prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]);
  }, []);

  const updateConversation = useCallback((id, data) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const totalUnread = useMemo(() =>
    conversations.reduce((sum, c) => sum + (c.unreadCount?.[currentUser?.id] || 0), 0),
    [conversations, currentUser?.id]
  );

  return {
    currentUser,
    conversations,
    allUsers,
    userMap,
    isLoading,
    totalUnread,
    findUserById,
    findUserByEmail,
    findOrFetchUser,
    getOtherParticipant,
    findExistingDirectChat,
    addConversation,
    updateConversation,
  };
}
