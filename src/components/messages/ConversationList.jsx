import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConversationList({ 
  conversations,
  users,
  currentUser,
  selectedConversation,
  onSelectConversation
}) {
  const getConversationInfo = (conversation) => {
    if (!currentUser) return { name: 'Unbekannt', avatar: null };

    if (conversation.is_group) {
      return {
        name: conversation.name || 'Gruppe',
        avatar: conversation.avatar_url,
        isGroup: true
      };
    }

    const otherEmail = conversation.participant_emails?.find(
      email => email !== currentUser.email
    );

    if (!otherEmail) {
      return { name: 'Unbekannt', avatar: null };
    }

    const otherUser = users.find(u => u.email === otherEmail);
    
    return {
      name: otherUser?.full_name || otherUser?.username || otherEmail.split('@')[0],
      avatar: otherUser?.avatar_url,
      email: otherEmail,
      isGroup: false
    };
  };

  const getUnreadCount = (conversation) => {
    if (!currentUser || !conversation.unread_counts) return 0;
    return conversation.unread_counts[currentUser.email] || 0;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation, index) => {
        const info = getConversationInfo(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedConversation?.id === conversation.id;

        return (
          <motion.button
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectConversation(conversation)}
            className={`w-full p-4 flex items-center gap-3 border-b border-zinc-800/50 transition-all ${
              isSelected
                ? 'bg-green-500/10 border-l-4 border-l-green-500'
                : 'hover:bg-zinc-900/30 active:bg-zinc-900/50'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {info.avatar ? (
                <img
                  src={info.avatar}
                  alt={info.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                  {info.isGroup ? (
                    <Users className="w-7 h-7" />
                  ) : (
                    info.name.charAt(0).toUpperCase()
                  )}
                </div>
              )}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-black shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${
                  unreadCount > 0 ? 'text-white' : 'text-zinc-300'
                }`}>
                  {info.name}
                </h3>
                {conversation.last_message_timestamp && (
                  <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                    {formatDistanceToNow(
                      new Date(conversation.last_message_timestamp),
                      { addSuffix: true, locale: de }
                    )}
                  </span>
                )}
              </div>
              {conversation.last_message_preview && (
                <p className={`text-sm truncate ${
                  unreadCount > 0 ? 'text-zinc-300 font-medium' : 'text-zinc-500'
                }`}>
                  {conversation.last_message_preview}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}