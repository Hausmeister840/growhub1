import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Bell, Check, MessageCircle, Heart, Users, 
  AtSign, Rss, CheckCheck, BellOff, Trash2,
  Brain, Sprout, Trophy, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { buildUserLookup, fetchUsersByEmails } from "@/api/userDirectory";

const TYPE_META = {
  reaction: { icon: Heart, label: "Reaktion", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  like: { icon: Heart, label: "Like", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  comment: { icon: MessageCircle, label: "Kommentar", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  follow: { icon: Users, label: "Follower", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  mention: { icon: AtSign, label: "Erwähnung", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  new_post: { icon: Rss, label: "Neuer Post", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  message: { icon: MessageCircle, label: "Nachricht", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  ai_scan: { icon: Brain, label: "KI-Analyse", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ai_warning: { icon: AlertTriangle, label: "KI-Warnung", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  diary_entry: { icon: Sprout, label: "Tagebuch", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  diary_milestone: { icon: Trophy, label: "Meilenstein", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
};

const TYPE_FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'reaction', label: '❤️ Reaktionen' },
  { id: 'comment', label: '💬 Kommentare' },
  { id: 'follow', label: '👥 Follower' },
  { id: 'message', label: '✉️ Nachrichten' },
  { id: 'ai', label: '🤖 KI' },
  { id: 'diary', label: '📔 Tagebuch' },
];

export default function Notifications() {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("unread");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [senderProfiles, setSenderProfiles] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const initUser = async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    initUser();
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsLoading(true);
    try {
      const query = tab === "unread"
        ? { recipient_email: currentUser.email, read: false }
        : { recipient_email: currentUser.email };

      const list = await base44.entities.Notification.filter(query, '-created_date', 100);
      setItems(list || []);

      // Load only the sender profiles we actually need
      const senderEmails = [...new Set((list || []).map(n => n.sender_email).filter(Boolean))];
      if (senderEmails.length > 0) {
        const senderUsers = await fetchUsersByEmails(senderEmails.slice(0, 20));
        setSenderProfiles(buildUserLookup(senderUsers));
      } else {
        setSenderProfiles({});
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, tab]);

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser, load]);

  // Real-time subscription for instant notification updates
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (!event.data) return;
      const notif = event.data;
      if (notif.recipient_email !== currentUser.email) return;

      if (event.type === 'create') {
        setItems(prev => [notif, ...prev]);
      } else if (event.type === 'update') {
        setItems(prev => prev.map(n => n.id === notif.id ? { ...n, ...notif } : n));
      } else if (event.type === 'delete') {
        setItems(prev => prev.filter(n => n.id !== event.id));
      }
    });
    return () => unsub();
  }, [currentUser?.email]);

  const markAllRead = async () => {
    const unread = items.filter(n => !n.read);
    if (unread.length === 0) return;

    // Optimistic update first
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Alle als gelesen markiert");

    // Then batch update in background (max 10 parallel)
    const batchSize = 10;
    for (let i = 0; i < unread.length; i += batchSize) {
      const batch = unread.slice(i, i + batchSize);
      await Promise.all(
        batch.map(n => 
          base44.entities.Notification.update(n.id, { read: true }).catch(() => {})
        )
      );
    }
    window.dispatchEvent(new Event('refreshNotifications'));
  };

  const deleteNotification = async (n) => {
    setItems(prev => prev.filter(x => x.id !== n.id));
    try {
      await base44.entities.Notification.delete(n.id);
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch {
      load(true);
    }
  };

  const markOneRead = async (n) => {
    if (n.read) return;
    // Optimistic
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    try {
      await base44.entities.Notification.update(n.id, { read: true });
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      // Revert on failure
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: false } : x));
      console.warn('Mark read failed:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markOneRead(notification);

    if (notification.post_id) {
      navigate(`/PostThread?id=${notification.post_id}`);
    } else if (notification.conversation_id) {
      navigate(`/Messages?conv=${notification.conversation_id}`);
    } else if (notification.type === 'message' && notification.sender_email) {
      navigate(`/Messages?user=${notification.sender_email}`);
    } else if (notification.diary_id) {
      navigate(`/GrowDiaryDetail?id=${notification.diary_id}`);
    } else if (notification.type === 'ai_scan' || notification.type === 'ai_warning') {
      navigate('/PlantScan');
    } else if (notification.sender_id && notification.type !== 'ai_scan' && notification.type !== 'ai_warning' && notification.type !== 'diary_entry' && notification.type !== 'diary_milestone') {
      navigate(`/Profile?id=${notification.sender_id}`);
    }
  };

  const groupByDay = (list) => {
    const groups = {};
    list.forEach(n => {
      const d = new Date(n.created_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key;
      if (d.toDateString() === today.toDateString()) {
        key = 'Heute';
      } else if (d.toDateString() === yesterday.toDateString()) {
        key = 'Gestern';
      } else {
        key = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
      }

      groups[key] = groups[key] || [];
      groups[key].push(n);
    });
    return Object.entries(groups);
  };

  const unreadCount = items.filter(n => !n.read).length;

  // Apply type filter
  const filteredItems = typeFilter === 'all' 
    ? items 
    : items.filter(n => {
        if (typeFilter === 'reaction') return n.type === 'reaction' || n.type === 'like';
        if (typeFilter === 'ai') return n.type === 'ai_scan' || n.type === 'ai_warning';
        if (typeFilter === 'diary') return n.type === 'diary_entry' || n.type === 'diary_milestone';
        return n.type === typeFilter;
      });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--gh-bg)] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[var(--gh-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gh-bg)] pb-20">
      {/* Header */}
      <div className="sticky top-[52px] lg:top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">Benachrichtigungen</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--gh-accent)] hover:text-[var(--gh-accent-hover)] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Alle gelesen
              </button>
            )}
          </div>

          <div className="flex gap-1.5 mb-2">
            {[
              { id: 'unread', label: 'Ungelesen', count: unreadCount },
              { id: 'all', label: 'Alle', count: 0 },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`gh-chip ${tab === t.id ? 'gh-chip-active' : ''}`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center px-1">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`gh-chip text-[11px] whitespace-nowrap ${typeFilter === f.id ? 'gh-chip-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[var(--gh-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 px-6"
          >
            <div className="w-20 h-20 mx-auto mb-5 bg-[var(--gh-surface)] rounded-3xl flex items-center justify-center border border-white/[0.06]">
              {tab === "unread"
                ? <Check className="w-9 h-9 text-[var(--gh-accent)]/50" />
                : <BellOff className="w-9 h-9 text-[var(--gh-text-muted)]" />
              }
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {tab === "unread" ? "Alles gelesen" : "Keine Benachrichtigungen"}
            </h3>
            <p className="text-sm text-[var(--gh-text-muted)] max-w-[240px] mx-auto">
              {tab === "unread" ? "Du bist auf dem neuesten Stand!" : "Interagiere mit anderen, um Benachrichtigungen zu erhalten"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {groupByDay(filteredItems).map(([day, list]) => (
              <div key={day}>
                <p className="text-[11px] font-semibold text-[var(--gh-text-muted)] uppercase tracking-wider mb-2 px-1">{day}</p>
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                  {list.map((n) => {
                    const meta = TYPE_META[n.type] || { 
                      icon: Bell, label: n.type, color: "text-[var(--gh-text-muted)]", bg: "bg-white/[0.04]", border: "border-white/[0.06]"
                    };
                    const Icon = meta.icon;
                    const sender = senderProfiles[n.sender_id] || senderProfiles[n.sender_email];

                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        className="group"
                      >
                        <button
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                            n.read
                              ? 'hover:bg-white/[0.03]'
                              : 'bg-[var(--gh-accent-subtle)] hover:bg-[var(--gh-accent-muted)] border border-[var(--gh-accent-subtle)]'
                          }`}
                        >
                          {/* Avatar with type icon overlay */}
                          <div className="relative flex-shrink-0">
                            {sender?.avatar_url ? (
                              <img src={sender.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-[1.5px] ring-white/[0.06]" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {(sender?.full_name?.[0] || sender?.username?.[0] || n.sender_email?.[0] || '?').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-black ${meta.bg}`}>
                              <Icon className={`w-2.5 h-2.5 ${meta.color}`} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug ${n.read ? 'text-[var(--gh-text-secondary)]' : 'text-white font-medium'}`}>
                              {n.message || meta.label}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color}`}>
                                {meta.label}
                              </span>
                              <span className="text-[11px] text-[var(--gh-text-muted)]">
                                {formatDistanceToNow(new Date(n.created_date), { addSuffix: true, locale: de })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!n.read && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--gh-accent)] shadow-lg shadow-green-500/30" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n); }}
                              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                            </button>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
