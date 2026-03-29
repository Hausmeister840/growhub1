import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";
import { 
  Image as ImageIcon, Send, Loader2, ArrowLeft, 
  MoreVertical, Check, CheckCheck
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import GlobalErrorHandler from "../utils/GlobalErrorHandler";
import { rateLimiter } from "../utils/RateLimiter";

function MessageBubble({ message, isOwnMessage, showAvatar, senderInfo, timestamp }) {
  const hasMedia = message.media_urls && message.media_urls.length > 0;
  const isRead = message.read_by && message.read_by.length > 1;

  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage ? (
        <div className="flex-shrink-0 w-8 h-8">
          {senderInfo?.avatar_url ? (
            <img
              src={senderInfo.avatar_url}
              alt={senderInfo.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {senderInfo?.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      ) : !isOwnMessage ? (
        <div className="w-8 flex-shrink-0" />
      ) : null}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[60%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwnMessage && (
          <span className="text-xs text-zinc-500 px-2">
            {senderInfo?.name || 'Unbekannt'}
          </span>
        )}

        {/* Media */}
        {hasMedia && (
          <div className="rounded-2xl overflow-hidden max-w-full">
            <img
              src={message.media_urls[0]}
              alt="Bild"
              className="max-w-full h-auto max-h-96 object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Text */}
        {message.content && (
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isOwnMessage
                ? 'bg-green-600 text-white rounded-br-md'
                : 'bg-zinc-800 text-white rounded-bl-md'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          </div>
        )}

        {/* Timestamp and Status */}
        <div className={`flex items-center gap-1 px-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-zinc-600">
            {timestamp}
          </span>
          {isOwnMessage && (
            <div className="text-zinc-600">
              {isRead ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessageArea({ conversation, currentUser, users, onBack, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const msgs = await GlobalErrorHandler.withRetry(
        () => base44.entities.Message.filter(
          { conversation_id: conversation.id },
          'created_date',
          100
        ),
        3,
        1000
      );

      if (abortControllerRef.current?.signal.aborted) return;

      setMessages(msgs || []);
      
      // Mark as read
      if (currentUser?.email) {
        const unreadCount = conversation.unread_counts?.[currentUser.email] || 0;
        if (unreadCount > 0) {
          try {
            await base44.entities.Conversation.update(conversation.id, {
              unread_counts: {
                ...conversation.unread_counts,
                [currentUser.email]: 0
              }
            });
            // Trigger badge refresh
            window.dispatchEvent(new Event('refreshNotifications'));
          } catch (err) {
            console.warn('Failed to mark as read:', err);
          }
        }
      }
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) return;
      GlobalErrorHandler.handleError(error, 'Messages Load');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [conversation?.id, currentUser?.email]);

  useEffect(() => {
    if (conversation?.id) {
      setIsLoading(true);
      loadMessages();
      
      const interval = setInterval(loadMessages, 5000);
      return () => {
        clearInterval(interval);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [conversation?.id, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || isSending || !currentUser) return;
    
    // Debug logging
    console.log('📨 Sending message:', {
      conversationId: conversation.id,
      currentUserEmail: currentUser.email,
      participantEmails: conversation.participant_emails,
      isParticipant: conversation.participant_emails?.includes(currentUser.email)
    });
    
    if (!rateLimiter.canMakeRequest(`message_${currentUser.email}`, 10, 60000)) {
      toast.error("Zu viele Nachrichten. Bitte warte kurz.");
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic Update: Sofort in UI anzeigen
    const optimisticMsg = {
      id: tempId,
      conversation_id: conversation.id,
      sender_email: currentUser.email,
      content: messageText,
      created_date: new Date().toISOString(),
      media_urls: [],
      read_by: [currentUser.email],
      _optimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setIsSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Erstelle Nachricht
      const newMsg = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        content: messageText,
        read_by: [currentUser.email]
      });

      // Ersetze optimistische Nachricht mit echter
      setMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));

      // Update conversation - Mit erhöhtem unread count für andere
      try {
        const newUnreadCounts = { ...conversation.unread_counts };
        conversation.participant_emails.forEach(email => {
          if (email !== currentUser.email) {
            newUnreadCounts[email] = (newUnreadCounts[email] || 0) + 1;
          }
        });

        await base44.entities.Conversation.update(conversation.id, {
          last_message_preview: messageText.substring(0, 100),
          last_message_timestamp: new Date().toISOString(),
          unread_counts: newUnreadCounts
        });
        
        if (onConversationUpdate) {
          onConversationUpdate({
            ...conversation,
            last_message_preview: messageText.substring(0, 100),
            last_message_timestamp: new Date().toISOString(),
            unread_counts: newUnreadCounts
          });
        }
      } catch (updateError) {
        console.warn('Conversation update failed:', updateError);
      }

    } catch (error) {
      console.error('❌ Message send error:', {
        error: error.message,
        conversationId: conversation.id,
        currentUserEmail: currentUser.email,
        participants: conversation.participant_emails
      });
      
      // Entferne fehlgeschlagene Nachricht
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText);
      
      // Check if user is not in participant list
      if (!conversation.participant_emails?.includes(currentUser.email)) {
        toast.error('Du wurdest aus dieser Unterhaltung entfernt');
      } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
        toast.error('Fehler beim Senden. Bitte Seite neu laden.');
      } else {
        toast.error('Nachricht konnte nicht gesendet werden');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    if (!rateLimiter.canMakeRequest(`upload_${currentUser.email}`, 5, 60000)) {
      toast.error("Zu viele Uploads. Bitte warte kurz.");
      return;
    }

    setIsUploading(true);

    try {
      const { file_url } = await GlobalErrorHandler.withRetry(
        () => base44.integrations.Core.UploadFile({ file }),
        3,
        1000
      );

      const newMsg = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        content: "",
        media_urls: [file_url]
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message_preview: "📷 Bild",
        last_message_timestamp: new Date().toISOString()
      });

      setMessages(prev => [...prev, newMsg]);

      if (onConversationUpdate) {
        onConversationUpdate({
          ...conversation,
          last_message_preview: "📷 Bild",
          last_message_timestamp: new Date().toISOString()
        });
      }

      toast.success('Bild gesendet!');
    } catch (error) {
      GlobalErrorHandler.handleError(error, 'Upload Image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    
    // Typing Indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const otherParticipants = conversation.participant_emails?.filter(
    email => email !== currentUser?.email
  ) || [];

  const getDisplayName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || user?.username || email.split('@')[0];
  };

  const getAvatar = (email) => {
    const user = users.find(u => u.email === email);
    return user?.avatar_url;
  };

  const getSenderInfo = (email) => {
    const user = users.find(u => u.email === email);
    return {
      name: user?.full_name || user?.username || email.split('@')[0],
      avatar_url: user?.avatar_url
    };
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Gestern ' + format(date, 'HH:mm');
    } else {
      return format(date, 'dd.MM. HH:mm');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {conversation.is_group ? (
          <>
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <MoreVertical className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold">
                {conversation.name || 'Gruppe'}
              </h2>
              <p className="text-sm text-zinc-500">
                {otherParticipants.length + 1} Teilnehmer
              </p>
            </div>
          </>
        ) : (
          <>
            {getAvatar(otherParticipants[0]) ? (
              <img
                src={getAvatar(otherParticipants[0])}
                alt={getDisplayName(otherParticipants[0])}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                {getDisplayName(otherParticipants[0])?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-white font-semibold">
                {getDisplayName(otherParticipants[0])}
              </h2>
              <p className="text-sm text-zinc-500">Aktiv</p>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-zinc-900 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 mb-2">Noch keine Nachrichten</p>
              <p className="text-sm text-zinc-600">
                Sende die erste Nachricht! 👋
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwnMessage = msg.sender_email === currentUser?.email;
              const showAvatar = !isOwnMessage && (
                idx === 0 || 
                messages[idx - 1]?.sender_email !== msg.sender_email
              );

              return (
                <div key={msg.id} className={msg._optimistic ? 'opacity-70' : ''}>
                  <MessageBubble
                    message={msg}
                    isOwnMessage={isOwnMessage}
                    showAvatar={showAvatar}
                    senderInfo={getSenderInfo(msg.sender_email)}
                    timestamp={formatMessageTime(msg.created_date)}
                  />
                </div>
              );
            })}
            
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <span className="text-xs text-zinc-500">schreibt...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 flex-shrink-0"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </Button>

          <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht schreiben..."
              className="w-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none px-4 py-3 resize-none max-h-[120px]"
              disabled={isSending}
              rows={1}
            />
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full flex-shrink-0"
            size="icon"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        <p className="text-xs text-zinc-600 mt-2 text-center">
          Enter zum Senden • Shift+Enter für neue Zeile
        </p>
      </div>
    </div>
  );
}