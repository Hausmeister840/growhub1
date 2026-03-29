import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Group } from '@/entities/Group';
import { Post } from '@/entities/Post';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Lock, Globe, LogOut, Loader2, UserCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import CommentsModal from '../components/comments/CommentsModal';
import { AnimatePresence } from 'framer-motion';

export default function GroupDetail() {
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postAuthors, setPostAuthors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [members, setMembers] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const groupId = new URLSearchParams(location.search).get('id');

  useEffect(() => {
    if (!groupId) {
      navigate(createPageUrl('Groups'));
      return;
    }

    const init = async () => {
      setIsLoading(true);
      try {
        let user = null;
        try {
          user = await User.me();
          setCurrentUser(user);
        } catch (error) {
          setCurrentUser(null);
        }

        const groupData = await Group.get(groupId);
        setGroup(groupData);

        const memberStatus = user ? groupData.members.includes(user.email) : false;
        setIsMember(memberStatus);

        if (groupData.privacy === 'private' && !memberStatus) {
          setPosts([]);
          setMembers([]);
          setIsLoading(false);
          return;
        }

        const [postData, memberDetails] = await Promise.all([
          Post.filter({ group_id: groupId }, '-created_date'),
          User.filter({ email: { '$in': groupData.members } })
        ]);

        setPosts(postData);
        setMembers(memberDetails);

        if (postData.length > 0) {
          const authorEmails = [...new Set(postData.map(p => p.created_by))];
          const authors = await User.filter({ email: { '$in': authorEmails } });
          const authorsMap = authors.reduce((acc, author) => {
            acc[author.email] = author;
            return acc;
          }, {});
          setPostAuthors(authorsMap);
        } else {
            setPostAuthors({});
        }

      } catch (error) {
        console.error("Error loading group details:", error);
        navigate(createPageUrl('Groups'));
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [groupId, navigate]);

  const handleJoinLeaveGroup = async () => {
    if (!currentUser) {
      await User.login();
      return;
    }
    setIsJoining(true);
    const currentIsMember = group.members.includes(currentUser.email);
    const newMembers = currentIsMember
      ? group.members.filter(email => email !== currentUser.email)
      : [...group.members, currentUser.email];

    try {
      await Group.update(groupId, { members: newMembers });
      setGroup(prev => ({ ...prev, members: newMembers }));
      setIsMember(!currentIsMember);
    } catch (error) {
      console.error("Error joining/leaving group:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeletePost = async (postId) => {
    await Post.delete(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostCreated = async () => {
    setShowCreatePost(false);
    const user = await User.me().catch(() => null);
    setCurrentUser(user);
    const groupData = await Group.get(groupId);
    setGroup(groupData);
    const memberStatus = user ? groupData.members.includes(user.email) : false;
    setIsMember(memberStatus);

    if (groupData.privacy === 'private' && !memberStatus) {
      setPosts([]);
      setMembers([]);
    } else {
      const [postUpdateData, memberDetailsUpdate] = await Promise.all([
        Post.filter({ group_id: groupId }, '-created_date'),
        User.filter({ email: { '$in': groupData.members } })
      ]);
      setPosts(postUpdateData);
      setMembers(memberDetailsUpdate);

      if (postUpdateData.length > 0) {
        const authorEmails = [...new Set(postUpdateData.map(p => p.created_by))];
        const authors = await User.filter({email: {'$in': authorEmails}});
        const authorsMap = authors.reduce((acc, author) => {
            acc[author.email] = author;
            return acc;
        }, {});
        setPostAuthors(authorsMap);
      } else {
        setPostAuthors({});
      }
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}` : names[0][0];
  };

  const isAdmin = currentUser && group?.admin_emails?.includes(currentUser.email);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-green-400" />
      </div>
    );
  }

  if (!group) {
    return <div className="p-8 text-center text-white">Gruppe nicht gefunden oder ein Fehler ist aufgetreten.</div>;
  }

  if (group.privacy === 'private' && !isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="max-w-md mx-auto glass-effect text-center p-8">
          <CardHeader>
            <Lock className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <CardTitle className="text-2xl font-bold text-white">Dies ist eine private Gruppe.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-6">Der Inhalt dieser Gruppe ist nur für Mitglieder sichtbar.</p>
            {currentUser ? (
              <Button onClick={handleJoinLeaveGroup} disabled={isJoining} className="grow-gradient min-w-[200px]">
                {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Beitrittsanfrage senden
              </Button>
            ) : (
                <Button onClick={() => User.login()} className="grow-gradient min-w-[200px]">
                    Anmelden zum Beitreten
                </Button>
            )}
            <Button variant="ghost" onClick={() => navigate(createPageUrl('Groups'))} className="mt-4 text-zinc-300">
              Zurück zu den Gruppen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Groups'))} className="flex items-center gap-2 text-white self-start pt-4">
          <ArrowLeft />
          Zurück zu allen Gruppen
        </Button>

        <Card className="glass-effect overflow-hidden">
          <div className="relative h-48 md:h-64 rounded-t-xl overflow-hidden">
            <img
              src={group.cover_image_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b1de26c0b_IMG_1371.jpg'}
              alt={`${group.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl md:text-4xl font-bold">{group.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={`${group.privacy === 'public' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} backdrop-blur-sm`}>
                  {group.privacy === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                  {group.privacy === 'public' ? 'Öffentliche Gruppe' : 'Private Gruppe'}
                </Badge>
                <div className="flex items-center gap-1 text-sm"><Users className="w-4 h-4" />{group.members.length} Mitglieder</div>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <p className="text-gray-300 text-sm flex-1">{group.description}</p>
              <div className="flex-shrink-0">
                {isAdmin ? (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-base p-3 rounded-lg">
                    <UserCheck className="w-4 h-4 mr-2" /> Du bist Admin
                  </Badge>
                ) : (
                  <Button
                    onClick={handleJoinLeaveGroup}
                    disabled={isJoining}
                    className={`min-w-[150px] transition-all ${isMember ? 'bg-red-600 hover:bg-red-700' : 'grow-gradient'}`}
                  >
                    {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isMember ? <><LogOut className="w-4 h-4 mr-2" /> Gruppe verlassen</> : <><Plus className="w-4 h-4 mr-2" /> Gruppe beitreten</>}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {isMember && (
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={currentUser?.avatar_url} />
                      <AvatarFallback>{getInitials(currentUser?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-lg text-zinc-400 cursor-pointer" onClick={() => setShowCreatePost(true)}>
                      Erstelle einen Beitrag in dieser Gruppe...
                    </div>
                    <Button onClick={() => setShowCreatePost(true)} className="grow-gradient">
                      <Plus className="w-4 h-4 mr-2" /> Posten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <h2 className="text-xl font-bold text-white pt-4">Beiträge</h2>
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={postAuthors[post.created_by]}
                    currentUser={currentUser}
                    onDelete={() => handleDeletePost(post.id)}
                    onComment={() => handleOpenComments(post)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>In dieser Gruppe gibt es noch keine Beiträge.</p>
                {isMember && <p>Sei der Erste, der etwas postet!</p>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Users className="text-green-400" /> Mitglieder ({members.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.slice(0, 10).map(member => (
                  <Link to={createPageUrl(`Profile?id=${member.id}`)} key={member.id}>
                    <div className="flex items-center gap-3 hover:bg-zinc-800/50 p-2 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white text-sm">{member.full_name}</p>
                        <p className="text-xs text-zinc-400">@{member.username}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {members.length > 10 && (
                    <p className="text-center text-zinc-500 text-sm mt-4">...und {members.length - 10} weitere Mitglieder.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ✅ CreatePost Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <CreatePost
            isOpen={showCreatePost}
            currentUser={currentUser}
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
            editPost={null}
          />
        )}
      </AnimatePresence>

      {/* ✅ Comments Modal */}
      <AnimatePresence>
        {showCommentsModal && selectedPost && (
          <CommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            post={selectedPost}
            currentUser={currentUser}
            onCommentAdded={(postId) => {
              console.log('Comment added to post:', postId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}