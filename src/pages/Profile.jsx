import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Grid, Sprout, Trophy, AlertTriangle, Loader2, Leaf } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { usePost } from "../components/hooks/usePost";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileAbout from "../components/profile/ProfileAbout";
import ProfileGrowDiaries from "../components/profile/ProfileGrowDiaries";
import ProfilePostsGrid from "../components/profile/ProfilePostsGrid";
import EnhancedGamificationPanel from "../components/profile/EnhancedGamificationPanel";
import FollowerListModal from "../components/profile/FollowerListModal";
import InlineProfileEditor from "../components/profile/InlineProfileEditor";
import BlockMuteManager from "../components/profile/BlockMuteManager";
import { ProfileSkeleton } from "../components/ui/LoadingSkeleton";
import PlantPortfolio from "../components/profile/PlantPortfolio";
import PrivateProfileMessage from "../components/profile/PrivateProfileMessage";
import LockedSectionMessage from "../components/profile/LockedSectionMessage";
import { canViewSection } from "../components/utils/privacyCheck";

async function retryOp(fn, retries = 2, ms = 1000) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries || e.name === 'AbortError') throw e;
      if (e.message?.includes('429')) await new Promise(r => setTimeout(r, ms * (i + 2)));
      else throw e;
    }
  }
}

const TABS = [
  { id: 'posts', icon: Grid, label: 'Beiträge' },
  { id: 'grows', icon: Sprout, label: 'Grows' },
  { id: 'plants', icon: Leaf, label: 'Pflanzen' },
  { id: 'achievements', icon: Trophy, label: 'Erfolge' },
];

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userDiaries, setUserDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showFollowerModal, setShowFollowerModal] = useState(false);
  const [followerModalMode, setFollowerModalMode] = useState('followers');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showBlockMute, setShowBlockMute] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [postsLoading, setPostsLoading] = useState(false);
  const [diariesLoading, setDiariesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsPage, setPostsPage] = useState(1);

  const profileUserRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const profileIdOrEmail = new URLSearchParams(location.search).get("id");
  const { handleReaction, handleBookmark, handleDelete } = usePost();

  // Auth — use a sentinel to distinguish "not yet loaded" from "not logged in"
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    base44.auth.me()
      .then(u => { setCurrentUser(u); setAuthChecked(true); })
      .catch(() => { setCurrentUser(null); setAuthChecked(true); });
  }, []);

  // Load profile
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUser && !profileIdOrEmail) return;
      setIsLoading(true);
      setError(null);
      setProfileUser(null);

      try {
        let target = null;
        let profilePayload = null;
        if (!profileIdOrEmail) {
          target = currentUser;
        } else {
          const res = await base44.functions.invoke('profile/getProfile', { target: profileIdOrEmail });
          if (res.data?.ok) {
            target = res.data.user;
            profilePayload = res.data;
          }
        }
        if (cancelled) return;

        if (!target) {
          setError({ title: 'Profil nicht gefunden', message: 'Dieser Benutzer existiert nicht.' });
          setIsLoading(false);
          return;
        }

        setProfileUser(target);
        profileUserRef.current = target;
        setProfileStats(profilePayload?.stats || {
          posts: target.posts_count || 0,
          followers: target.followers_count || (target.followers?.length || 0),
          following: target.following_count || (target.following?.length || 0),
          xp: target.xp || 0,
          reputation: target.reputation_score || 0,
        });

        if (currentUser && currentUser.id !== target.id) {
          if (typeof profilePayload?.is_following === 'boolean') {
            setIsFollowing(profilePayload.is_following);
          } else {
            // Check follow status from Follow entity for accuracy
            try {
              const follows = await base44.entities.Follow.filter({
                follower_id: currentUser.id,
                followee_id: target.id,
                status: 'active'
              });
              setIsFollowing(follows?.length > 0);
            } catch {
              // Fallback to user data
              setIsFollowing((currentUser.following || []).includes(target.email));
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError({ title: 'Fehler beim Laden', message: e.message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    if (authChecked && (currentUser || profileIdOrEmail)) load();
    else if (authChecked && !currentUser && !profileIdOrEmail) {
      // Not logged in and no target — redirect to feed
      navigate('/Feed');
    }
    return () => { cancelled = true; };
  }, [authChecked, currentUser, profileIdOrEmail]);

  // Load posts
  const loadPosts = useCallback(async (reset = false) => {
    if (!profileUser) return;
    setPostsLoading(true);
    const page = reset ? 1 : postsPage;
    try {
      const posts = await retryOp(() =>
        base44.entities.Post.filter({ created_by: profileUser.email }, '-created_date', 12, (page - 1) * 12)
      );
      if (reset) setUserPosts(posts || []);
      else setUserPosts(prev => [...prev, ...(posts || [])]);
      setHasMorePosts((posts || []).length === 12);
      setPostsPage(reset ? 2 : page + 1);
      if (reset) setProfileStats(prev => ({ ...prev, posts: posts?.length || prev?.posts || 0 }));
    } catch { } finally { setPostsLoading(false); }
  }, [profileUser, postsPage]);

  // Load diaries
  const loadDiaries = useCallback(async () => {
    if (!profileUser) return;
    setDiariesLoading(true);
    try {
      const diaries = await retryOp(() =>
        base44.entities.GrowDiary.filter({ created_by: profileUser.email }, '-created_date', 20)
      );
      setUserDiaries(diaries || []);
    } catch { } finally { setDiariesLoading(false); }
  }, [profileUser]);

  useEffect(() => {
    if (profileUser?.id) {
      loadPosts(true);
      loadDiaries();
    }
  }, [profileUser?.id]);

  // Follow
  const handleFollow = useCallback(async () => {
    if (!currentUser || !profileUser || isFollowLoading || currentUser.id === profileUser.id) return;
    setIsFollowLoading(true);
    const was = isFollowing;
    setIsFollowing(!was);

    try {
      try {
        await base44.functions.invoke('toggleFollow', { targetUserId: profileUser.id });
      } catch {
        // Some deployments only expose the namespaced function.
        await base44.functions.invoke('profile/toggleFollow', { targetUserId: profileUser.id });
      }
      toast.success(was ? 'Entfolgt' : 'Gefolgt!');
      // Notification is created server-side in toggleFollow — no duplicate needed here
      setProfileStats(prev => ({ ...prev, followers: prev.followers + (was ? -1 : 1) }));
    } catch {
      setIsFollowing(was);
      toast.error('Aktion fehlgeschlagen');
    } finally { setIsFollowLoading(false); }
  }, [currentUser, profileUser, isFollowing, isFollowLoading]);

  const handleShare = useCallback(() => {
    if (!profileUser) return;
    const url = `${window.location.origin}/Profile?id=${profileUser.id}`;
    if (navigator.share) navigator.share({ title: `${profileUser.full_name} auf GrowHub`, url }).catch(() => {});
    else { navigator.clipboard.writeText(url); toast.success('Link kopiert!'); }
  }, [profileUser]);

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  // Privacy checks
  const privacyMode = profileUser?.privacy_mode || 'public';
  const canViewProfile = canViewSection(privacyMode, isOwnProfile, isFollowing);
  const canViewPosts = canViewSection(profileUser?.show_posts || 'public', isOwnProfile, isFollowing);
  const canViewGrows = canViewSection(profileUser?.show_grow_diaries || 'public', isOwnProfile, isFollowing);
  const canViewPlants = canViewSection(profileUser?.show_plant_scans || 'private', isOwnProfile, isFollowing);
  const canViewAchievements = canViewSection(profileUser?.show_achievements || 'public', isOwnProfile, isFollowing);
  const showFollowersList = isOwnProfile || (profileUser?.show_followers_list !== false);

  if (isLoading) return <div className="min-h-screen bg-black"><ProfileSkeleton /></div>;

  if (error && !profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{error.title}</h2>
          <p className="text-zinc-400 text-sm mb-6">{error.message}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/Feed')} className="bg-green-600 hover:bg-green-700">Zum Feed</Button>
            <Button onClick={() => navigate(-1)} variant="outline">Zurück</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="min-h-screen bg-black pb-24">
      <ProfileHeader
        user={profileUser}
        stats={profileStats}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
        onFollow={handleFollow}
        onMessage={() => navigate(`/Messages?user=${profileUser.email}`)}
        onShare={handleShare}
        onEdit={() => setShowProfileEditor(true)}
        onBlockMute={!isOwnProfile && currentUser ? () => setShowBlockMute(true) : undefined}
        onFollowersClick={showFollowersList ? () => { setFollowerModalMode('followers'); setShowFollowerModal(true); } : undefined}
        onFollowingClick={showFollowersList ? () => { setFollowerModalMode('following'); setShowFollowerModal(true); } : undefined}
      />

      {/* About section (only if bio or interests exist) */}
      <div className="px-4 sm:px-6 mt-5">
        <ProfileAbout user={profileUser} />
      </div>

      {/* Tab bar */}
      <div className="mt-5 border-b border-white/[0.06] sticky top-[52px] lg:top-0 z-20 bg-black">
        <div className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-all border-b-2 ${
                  isActive ? 'text-white border-white' : 'text-[var(--gh-text-muted)] border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-1">
        {!canViewProfile && !isOwnProfile ? (
          <PrivateProfileMessage />
        ) : (
          <>
            {activeTab === 'posts' && (
              canViewPosts ? (
                <div>
                  <ProfilePostsGrid posts={userPosts} isLoading={postsLoading && userPosts.length === 0} />
                  {hasMorePosts && userPosts.length > 0 && (
                    <div className="text-center py-6">
                      <Button onClick={() => loadPosts(false)} disabled={postsLoading} variant="ghost" className="text-zinc-400 text-sm">
                        {postsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {postsLoading ? 'Laden...' : 'Mehr laden'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : <LockedSectionMessage label="Beiträge" />
            )}

            {activeTab === 'grows' && (
              canViewGrows ? (
                <div className="px-4 sm:px-6 pt-4">
                  <ProfileGrowDiaries diaries={userDiaries} isLoading={diariesLoading} showAll />
                </div>
              ) : <LockedSectionMessage label="Grow-Tagebücher" />
            )}

            {activeTab === 'plants' && (
              canViewPlants ? (
                <div className="px-4 sm:px-6 pt-4">
                  <PlantPortfolio user={profileUser} isOwnProfile={isOwnProfile} />
                </div>
              ) : <LockedSectionMessage label="Pflanzen-Scans" />
            )}

            {activeTab === 'achievements' && (
              canViewAchievements ? (
                <div className="px-4 sm:px-6 pt-4">
                  <EnhancedGamificationPanel user={profileUser} stats={profileStats} />
                </div>
              ) : <LockedSectionMessage label="Erfolge" />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showFollowerModal && (
          <FollowerListModal
            userId={profileUser.id} type={followerModalMode}
            isOpen={showFollowerModal} onClose={() => setShowFollowerModal(false)}
            currentUser={currentUser}
          />
        )}
        {showProfileEditor && isOwnProfile && (
          <InlineProfileEditor
            user={currentUser}
            onClose={() => setShowProfileEditor(false)}
            onSave={async (data) => {
              await base44.functions.invoke('profile/updateProfile', data);
              const updated = await base44.auth.me();
              setCurrentUser(updated); setProfileUser(updated);
              toast.success('Profil aktualisiert!');
              setShowProfileEditor(false);
            }}
          />
        )}
        {showBlockMute && !isOwnProfile && (
          <BlockMuteManager
            isOpen={showBlockMute} onClose={() => setShowBlockMute(false)}
            currentUser={currentUser} targetUser={profileUser} onUpdate={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
