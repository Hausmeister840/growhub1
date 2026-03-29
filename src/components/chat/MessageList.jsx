import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingBubble from './TypingBubble';

const formatDateSeparator = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Heute';
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
};

const MessageList = memo(forwardRef(({ 
  messages, currentUser, onReply, onReact, onRetry, onMediaClick,
  onDelete, onForward, typingUser, highlightId
}, ref) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    scrollToMessage: (msgId) => {
      const el = containerRef.current?.querySelector(`[data-msg-id="${msgId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrolling.current = !isAtBottom;
      setShowScrollBtn(!isAtBottom);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && !isUserScrolling.current) {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  const renderedMessages = useMemo(() => {
    if (messages.length === 0) return null;
    
    const allMediaMessages = (messages || [])
      .filter(m => m?.media?.url && (m.type === 'image' || m.type === 'video'))
      .map(m => ({ url: m.media.url, type: m.type, messageId: m.id }));

    const elements = [];
    let lastDate = null;

    (messages || []).forEach((message, idx) => {
      if (!message || !message.id) return;

      const msgDate = new Date(message.created_date).toDateString();
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        elements.push(
          <div key={`date-${msgDate}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-zinc-500 font-medium px-3 py-1 bg-zinc-900/80 rounded-full">
              {formatDateSeparator(message.created_date)}
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
        );
      }

      // System messages
      if (message.type === 'system') {
        elements.push(
          <div key={message.id} className="flex justify-center my-3">
            <span className="text-xs text-zinc-500 bg-zinc-900/60 px-3 py-1 rounded-full">{message.content}</span>
          </div>
        );
        return;
      }

      const isOwn = message.senderId === currentUser?.id;
      const prevMessage = messages[idx - 1];
      const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);
      const showName = !isOwn && showAvatar;

      elements.push(
        <div key={message.id} data-msg-id={message.id}>
          <MessageBubble
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
            showName={showName}
            currentUser={currentUser}
            onReply={onReply}
            onReact={onReact}
            onRetry={onRetry}
            onDelete={onDelete}
            onForward={onForward}
            highlight={highlightId === message.id}
            onMediaClick={(media) => {
              if (onMediaClick && media?.url) {
                const mediaIndex = allMediaMessages.findIndex(m => m.messageId === message.id);
                onMediaClick(media, allMediaMessages, Math.max(0, mediaIndex));
              }
            }}
          />
        </div>
      );
    });

    return elements;
  }, [messages, currentUser?.id, onReply, onReact, onRetry, onMediaClick, onDelete, onForward, highlightId]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <p className="text-gray-400">Noch keine Nachrichten</p>
          <p className="text-sm text-gray-600 mt-1">Sende die erste Nachricht!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} className="h-full overflow-y-auto bg-gradient-to-b from-black via-black to-zinc-950 px-4 py-6 space-y-2">
        {renderedMessages}
        <AnimatePresence>
          {typingUser && <TypingBubble userName={typingUser} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-4 right-4 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}));

MessageList.displayName = 'MessageList';
export default MessageList;