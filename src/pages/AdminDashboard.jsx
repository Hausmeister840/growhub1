import { useState, useEffect } from "react";
import { base44 } from '@/api/base44Client';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bell } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import AdminOverview from "../components/admin/AdminOverview";
import AdminUserManagement from "../components/admin/AdminUserManagement";
import AdminContentModeration from "../components/admin/AdminContentModeration";
import AdminStatistics from "../components/admin/AdminStatistics";
import AdminSettings from "../components/admin/AdminSettings";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const ADMIN_EMAIL = "Schillerdeniz@gmail.com";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.role === 'admin') {
          setIsAuthorized(true);
          await loadNotifications();
        } else {
          toast.error("Zugriff verweigert - Keine Admin-Berechtigung");
          setTimeout(() => navigate(createPageUrl('Feed')), 2000);
        }
      } catch (error) {
        toast.error("Nicht authentifiziert");
        setTimeout(() => navigate(createPageUrl('Feed')), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  const loadNotifications = async () => {
    try {
      const posts = await base44.entities.Post.list('-created_date', 500);
      
      const pendingReview = (posts || []).filter(p => p.requires_manual_review || p.moderation_status === 'pending');
      
      const notifs = [];
      if (pendingReview.length > 0) {
        notifs.push({
          id: 'pending-review',
          type: 'warning',
          message: `${pendingReview.length} Posts warten auf Moderation`,
          action: () => setActiveTab('content')
        });
      }

      setNotifications(notifs);
    } catch (error) {
      console.error('Notifications error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Lade Admin-Dashboard..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Shield className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Zugriff verweigert</h2>
          <p className="text-zinc-400">Sie haben keine Admin-Berechtigung</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="max-w-[1800px] mx-auto p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-zinc-400">Willkommen zurück, {currentUser?.full_name}</p>
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="relative">
                <button className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all">
                  <Bell className="w-5 h-5 text-zinc-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Alert Notifications */}
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4 cursor-pointer hover:bg-yellow-500/20 transition-all"
                onClick={notif.action}
              >
                <p className="text-yellow-400 font-medium">{notif.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-2 grid grid-cols-5 gap-2 mb-8">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-2xl transition-all"
            >
              Übersicht
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-2xl transition-all"
            >
              Nutzer
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-2xl transition-all"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-2xl transition-all"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-2xl transition-all"
            >
              Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <AdminOverview onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <AdminContentModeration />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <AdminStatistics />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}