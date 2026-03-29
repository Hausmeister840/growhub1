
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import GrowHubLogo from '../ui/GrowHubLogo';
import {
  Home,
  Bell,
  User,
  MessageCircle,
  BarChart3,
  Shield,
  LogOut,
  Search
} from 'lucide-react';
import NotificationButton from '../notifications/NotificationButton';
import { motion } from 'framer-motion';
import { Conversation } from '@/entities/Conversation';
import { Message } from '@/entities/Message';


export default function DesktopSidebar({ user, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation(); // Added useLocation
  const [unreadCount, setUnreadCount] = useState(0); // Added unreadCount state

  // ✅ Unread Messages Counter
  useEffect(() => {
    if (!user?.email) return;

    const loadUnreadCount = async () => {
      try {
        // Assuming Conversation and Message entities are available globally or imported
        // and have methods like 'filter' that return Promises of data.
        const conversations = await Conversation.filter({
          participant_emails: user.email
        });

        let totalUnread = 0;

        for (const conv of conversations) {
          const messages = await Message.filter({
            conversation_id: conv.id
          });

          const unreadInConv = messages.filter(m =>
            m.sender_email !== user.email &&
            (!m.read_by || !m.read_by.includes(user.email))
          ).length;

          totalUnread += unreadInConv;
        }

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error loading unread count:', error);
        // Fallback to 0 or handle error appropriately
        setUnreadCount(0);
      }
    };

    loadUnreadCount();

    // Poll every 10 seconds for unread updates
    const interval = setInterval(loadUnreadCount, 10000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [user?.email]);

  const handleLogout = () => {
    // In a real application, you'd clear authentication tokens, local storage,
    // or call an API endpoint to invalidate the session.
    // For this example, we'll just simulate a logout by clearing a token and navigating.
    console.log("User logged out");
    localStorage.removeItem('authToken'); // Example: clear an auth token
    // If you have a global auth context, you would call a logout function from there:
    // authContext.logout();
    navigate('/login'); // Redirect to the login page
  };

  const mainNavItems = [
    { name: 'Feed', icon: Home, path: createPageUrl('Feed'), key: 'Feed' },
    { name: 'Suchen', icon: Search, path: createPageUrl('Search'), key: 'Search' },
    { name: 'Nachrichten', icon: MessageCircle, path: createPageUrl('Messages'), key: 'Messages', badge: unreadCount },
    { name: 'Benachrichtigungen', icon: Bell, path: createPageUrl('Notifications'), key: 'Notifications' },
    { name: 'Profil', icon: User, path: user ? createPageUrl(`Profile?id=${user.id}`) : createPageUrl('Profile'), key: 'Profile' },
  ];

  // Admin items, conditionally added
  const adminNavItems = user?.role === 'admin'
    ? [
        { name: 'Dashboard', icon: BarChart3, path: createPageUrl('Dashboard'), key: 'Dashboard' },
        { name: 'System Audit', icon: Shield, path: createPageUrl('AuditDashboard'), key: 'AuditDashboard' },
      ]
    : [];

  const allMenuItems = [...mainNavItems, ...adminNavItems];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-zinc-800 flex-col z-50">
      <div className="p-2 mb-4">
        <GrowHubLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allMenuItems.map((item) => {
          const Icon = item.icon;
          const active = currentPageName === item.key; // Using 'key' instead of 'pageName' for consistency

          return (
            <Link
              key={item.key}
              to={item.path}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                active
                  ? 'bg-green-500/10 text-green-500' // Updated active style
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white' // Updated hover style
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" /> {/* Icon size updated */}

                {/* Unread Badge */}
                {item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </motion.div>
                )}
              </div>

              <span className="font-medium">{item.name}</span> {/* Using item.name */}

              {active && (
                <motion.div
                  layoutId="activeDesktopNav"
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <Link to={createPageUrl(`Profile?id=${user?.id}`)} className="flex-1">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900 transition-colors">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-black">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                  <p className="text-xs text-zinc-400 truncate">@{user.username || user.email?.split('@')[0]}</p>
                </div>
              </div>
            </Link>

            {/* Notification Button */}
            <NotificationButton currentUser={user} />
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      )}
    </aside>
  );
}
