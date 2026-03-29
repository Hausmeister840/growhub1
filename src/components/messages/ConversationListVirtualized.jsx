import { useVirtualList } from '../hooks/useVirtualList';
import { ConversationSkeleton } from '../ui/Skeleton';
import { motion } from 'framer-motion';

/**
 * 💬 VIRTUALIZED CONVERSATION LIST - Performance-optimiert
 */

export default function ConversationListVirtualized({
  conversations = [],
  onSelectConversation,
  selectedConversationId,
  currentUser,
  users = [],
  isLoading = false
}) {
  const {
    containerRef,
    visibleItems,
    totalHeight
  } = useVirtualList({
    items: conversations,
    itemHeight: 80,
    containerHeight: typeof window !== 'undefined' ? window.innerHeight - 200 : 600,
    overscan: 3
  });

  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-zinc-500">
        <p>Keine Konversationen</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto flex-1"
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item: conv, index, offsetTop }) => {
          const isSelected = selectedConversationId === conv.id;
          
          let displayTitle = conv.name;
          if (!conv.is_group && conv.participant_emails && currentUser) {
            const otherParticipantEmail = conv.participant_emails.find(
              email => email !== currentUser.email
            );
            const otherUser = users.find(user => user.email === otherParticipantEmail);
            displayTitle = otherUser?.full_name || otherParticipantEmail;
          }

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              style={{
                position: 'absolute',
                top: offsetTop,
                left: 0,
                right: 0,
                height: 80
              }}
              className={`p-4 border-b border-zinc-800 cursor-pointer flex flex-col ${
                isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'
              }`}
              onClick={() => onSelectConversation(conv)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold truncate flex-1 pr-2">
                  {displayTitle}
                </h3>
                {conv.last_message_timestamp && (
                  <span className="text-xs text-zinc-400">
                    {new Date(conv.last_message_timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 truncate mt-1">
                {conv.last_message_text || 'Keine Nachrichten'}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}