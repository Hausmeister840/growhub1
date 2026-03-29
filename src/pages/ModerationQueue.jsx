import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertTriangle, CheckCircle, XCircle, Eye, Clock, 
  Shield, Image as ImageIcon 
} from 'lucide-react';

/**
 * 🛡️ MODERATION QUEUE
 * Für Admins/Moderatoren
 */

export default function ModerationQueue() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Only admins can access
      if (currentUser.role !== 'admin') {
        toast.error('Keine Berechtigung');
        window.location.href = '/Feed';
        return;
      }

      // Load posts under review
      const pendingPosts = await base44.entities.Post.filter({
        $or: [
          { status: 'under_review' },
          { requires_manual_review: true }
        ]
      }, '-created_date');

      setPosts(pendingPosts);
    } catch (error) {
      console.error('Error loading moderation queue:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (post) => {
    try {
      await base44.entities.Post.update(post.id, {
        status: 'published',
        moderation_status: 'allow',
        requires_manual_review: false,
        moderation_notes: adminNotes || 'Manually approved by admin'
      });

      toast.success('Post freigegeben');
      loadData();
      setSelectedPost(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving post:', error);
      toast.error('Fehler beim Freigeben');
    }
  };

  const handleReject = async (post) => {
    try {
      await base44.entities.Post.update(post.id, {
        status: 'removed',
        moderation_status: 'block',
        requires_manual_review: false,
        visibility: 'private',
        moderation_notes: adminNotes || 'Manually rejected by admin'
      });

      // Send notification to user
      await base44.integrations.Core.SendEmail({
        to: post.created_by,
        subject: 'Post wurde entfernt - GrowHub',
        body: `
Hallo,

dein Post wurde von unserem Moderationsteam entfernt.

Grund: ${adminNotes || 'Verstoß gegen Community-Richtlinien'}

Bei Fragen wende dich bitte an support@growhub.de

Beste Grüße,
Das GrowHub Team
        `
      });

      toast.success('Post abgelehnt');
      loadData();
      setSelectedPost(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast.error('Fehler beim Ablehnen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Lade Moderation Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-white">Moderation Queue</h1>
          </div>
          <p className="text-zinc-400">
            {posts.length} Posts warten auf Überprüfung
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Alles erledigt! ✅
            </h3>
            <p className="text-zinc-400">
              Keine Posts in der Moderation Queue
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex gap-6">
                  {/* Post Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Under Review
                      </Badge>
                      {post.requires_manual_review && (
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High Priority
                        </Badge>
                      )}
                    </div>

                    <p className="text-white mb-4">{post.content}</p>

                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        <ImageIcon className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          {post.media_urls.length} Medien
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-zinc-500">
                      Von: {post.created_by} • {new Date(post.created_date).toLocaleString('de-DE')}
                    </div>

                    {post.moderation_reason && (
                      <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <strong className="text-orange-400 text-sm">AI Reason:</strong>
                        <p className="text-sm text-zinc-300 mt-1">{post.moderation_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <Button
                      onClick={() => setSelectedPost(post)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>

                    <Button
                      onClick={() => handleApprove(post)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Freigeben
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedPost(post);
                        // Auto-focus on notes
                      }}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </div>

                {/* Admin Notes Input */}
                {selectedPost?.id === post.id && (
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <label className="text-sm font-medium text-white mb-2 block">
                      Admin Notizen:
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Optional: Grund für die Entscheidung..."
                      className="bg-zinc-800 border-zinc-700 mb-3"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(post)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Bestätigen & Freigeben
                      </Button>
                      <Button
                        onClick={() => handleReject(post)}
                        variant="destructive"
                      >
                        Bestätigen & Ablehnen
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedPost(null);
                          setAdminNotes('');
                        }}
                        variant="ghost"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}