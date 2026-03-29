import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { updateConversation as updateConvBackend } from '@/functions/chat/updateConversation';
import { createNotification } from '@/components/utils/createNotification';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import ChatMediaViewer from './ChatMediaViewer';
import ChatSettingsSheet from './ChatSettingsSheet';
import MessageSearchSheet from './MessageSearchSheet';
import ForwardMessageModal from './ForwardMessageModal';

export default function ChatView({
  conversationId, currentUser, allUsers, userMap, conversations, updateConversation, onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [viewerMedia, setViewerMedia] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [highlightMsgId, setHighlightMsgId] = useState(null);
  const messageListRef = useRef(null);
  const activeRef = useRef(true);
  const sendingRef = useRef(false);

  const conversation = (conversations || []).find(c => c.id === conversationId) || null;
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  // Load messages + mark as read
  useEffect(() => {
    activeRef.current = true;
    setIsLoading(true);
    setReplyingTo(null);
    setShowSearch(false);
    setHighlightMsgId(null);

    if (!conversationId || !currentUser?.id) {
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const msgs = await base44.entities.Message.filter({ conversationId }, 'created_date', 500);
        if (!activeRef.current) return;
        setMessages(msgs || []);

        if (conversation) {
          const myUnread = conversation.unreadCount?.[currentUser.id] || 0;
          if (myUnread > 0) {
            const updated = { ...(conversation.unreadCount || {}), [currentUser.id]: 0 };
            updateConvBackend({ conversationId, data: { unreadCount: updated } }).catch(() => {});
            updateConversation?.(conversationId, { unreadCount: updated });
          }
        }
      } catch (err) {
        console.error('ChatView load error:', err);
      } finally {
        if (activeRef.current) setIsLoading(false);
      }
    })();

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (!activeRef.current) return;
      const msg = event.data;

      if (event.type === 'create') {
        if (!msg || msg.conversationId !== conversationId) return;
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        const updated = { ...(conversationRef.current?.unreadCount || {}), [currentUser.id]: 0 };
        updateConvBackend({ conversationId, data: { unreadCount: updated } }).catch(() => {});
        updateConversation?.(conversationId, { unreadCount: updated });
        setTimeout(() => messageListRef.current?.scrollToBottom(), 100);
      } else if (event.type === 'update') {
        if (!msg || msg.conversationId !== conversationId) return;
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
      } else if (event.type === 'delete') {
        // For delete events, only remove if the message was in our current list
        const deletedId = event.id;
        if (!deletedId) return;
        setMessages(prev => {
          const exists = prev.some(m => m.id === deletedId);
          return exists ? prev.filter(m => m.id !== deletedId) : prev;
        });
      }
    });

    return () => { activeRef.current = false; unsubscribe(); };
  }, [conversationId, currentUser?.id]);

  // Send message
  const handleSend = useCallback(async (content, type = 'text', media = null) => {
    const conv = conversationRef.current;
    if ((!content?.trim() && !media) || !conv || !currentUser?.id) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);

    const tempId = `temp_${Date.now()}`;
    const senderName = currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'User';

    const optimistic = {
      id: tempId, conversationId, senderId: currentUser.id, senderName,
      senderAvatar: currentUser.avatar_url || null, type, content: content || '',
      status: 'sending', created_date: new Date().toISOString(), _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    const capturedReply = replyingTo;
    setReplyingTo(null);
    setTimeout(() => messageListRef.current?.scrollToBottom(), 50);

    try {
      let mediaData = null;
      if (media?.blob) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: media.blob });
        mediaData = { url: file_url, type: media.type, size: media.size };
        if (media.duration) mediaData.duration = media.duration;
      }

      const messageData = {
        conversationId, senderId: currentUser.id, senderName,
        senderAvatar: currentUser.avatar_url || null, type,
        content: content?.trim() || '', status: 'sent',
        ...(mediaData && { media: mediaData }),
        ...(capturedReply && { replyTo: { id: capturedReply.id, content: capturedReply.content, senderName: capturedReply.senderName } }),
      };

      const newMessage = await base44.entities.Message.create(messageData);
      setMessages(prev => prev.map(m => m.id === tempId ? newMessage : m));

      // Update conversation metadata (fire-and-forget)
      const newUnread = { ...(conv.unreadCount || {}) };
      (conv.participants || []).forEach(pid => {
        if (pid !== currentUser.id) newUnread[pid] = (newUnread[pid] || 0) + 1;
      });
      newUnread[currentUser.id] = 0;

      const preview = content?.trim() || (type === 'image' ? '📷 Foto' : type === 'voice' ? '🎤 Sprachnachricht' : type === 'video' ? '🎬 Video' : '');
      const convUpdate = {
        lastMessage: { id: newMessage.id, content: preview, senderId: currentUser.id, senderName, timestamp: new Date().toISOString(), type },
        unreadCount: newUnread,
      };
      updateConvBackend({ conversationId, data: convUpdate }).catch(() => {});
      updateConversation?.(conversationId, convUpdate);

      // Notify (fire-and-forget)
      (conv.participants || []).forEach(pid => {
        if (pid === currentUser.id) return;
        const recipient = userMap?.[pid];
        if (recipient?.email) {
          createNotification({
            recipientEmail: recipient.email,
            senderEmail: currentUser.email,
            senderId: currentUser.id,
            type: 'message',
            conversationId,
            message: `${senderName}: ${preview.slice(0, 80)}`,
          }).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      toast.error('Nachricht konnte nicht gesendet werden');
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [conversationId, currentUser, userMap, replyingTo, updateConversation]);

  const handleRetry = useCallback(async (failedMsg) => {
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    await handleSend(failedMsg.content, failedMsg.type);
  }, [handleSend]);

  const handleReact = useCallback(async (messageId, emoji) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    const reactions = { ...(message.reactions || {}) };
    const users = reactions[emoji] || [];
    if (users.includes(currentUser.id)) {
      reactions[emoji] = users.filter(id => id !== currentUser.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, currentUser.id];
    }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    await base44.entities.Message.update(messageId, { reactions }).catch(() => {});
  }, [messages, currentUser?.id]);

  // Delete message
  const handleDelete = useCallback(async (msg) => {
    if (!msg || msg.senderId !== currentUser?.id) return;
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    try {
      await base44.entities.Message.delete(msg.id);
      toast.success('Nachricht gelöscht');
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  }, [currentUser?.id]);

  // Jump to searched message
  const handleJumpToMessage = useCallback((msgId) => {
    setHighlightMsgId(msgId);
    messageListRef.current?.scrollToMessage(msgId);
    setTimeout(() => setHighlightMsgId(null), 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Loader2 className="w-7 h-7 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-white font-semibold mb-1">Chat nicht verfügbar</p>
        <p className="text-sm text-zinc-500 mb-4">Dieser Chat existiert nicht mehr.</p>
        <button onClick={onBack} className="gh-btn-primary px-6 py-2.5 text-sm">Zurück</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <ChatHeader
        conversation={conversation}
        currentUser={currentUser}
        allUsers={allUsers}
        onBack={onBack}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Search bar overlay */}
      <AnimatePresence>
        {showSearch && (
          <MessageSearchSheet
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            messages={messages}
            onJumpToMessage={handleJumpToMessage}
          />
        )}
      </AnimatePresence>

      <MessageList
        ref={messageListRef}
        messages={messages}
        currentUser={currentUser}
        onReply={setReplyingTo}
        onReact={handleReact}
        onRetry={handleRetry}
        onDelete={handleDelete}
        onForward={(msg) => setForwardMsg(msg)}
        highlightId={highlightMsgId}
        onMediaClick={(media, allMedia, index) => setViewerMedia({ media, allMedia, index })}
      />

      {replyingTo && (
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800/60 flex items-center gap-3">
          <div className="w-0.5 h-8 bg-green-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-400 font-medium">{replyingTo.senderName}</p>
            <p className="text-xs text-zinc-400 truncate">{replyingTo.content}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      <MessageInput onSend={handleSend} onTyping={() => {}} disabled={isSending} />

      {viewerMedia && (
        <ChatMediaViewer
          media={viewerMedia.media}
          allMedia={viewerMedia.allMedia}
          currentIndex={viewerMedia.index}
          onClose={() => setViewerMedia(null)}
        />
      )}

      <ChatSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        conversation={conversation}
        currentUser={currentUser}
        allUsers={allUsers}
        updateConversation={updateConversation}
        onDelete={onBack}
        onSearchMessages={() => setShowSearch(true)}
      />

      <AnimatePresence>
        {forwardMsg && (
          <ForwardMessageModal
            isOpen={!!forwardMsg}
            onClose={() => setForwardMsg(null)}
            message={forwardMsg}
            currentUser={currentUser}
            conversations={conversations}
            allUsers={allUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}