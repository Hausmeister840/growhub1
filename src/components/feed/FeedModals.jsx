import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import CreatePost from './CreatePost';
import CommentsModal from '../comments/CommentsModal';
import UniversalSwipeViewer from '../viewer/UniversalSwipeViewer';
import ShareModal from './ShareModal';

export default function FeedModals({
  modals = {},
  modalData = {},
  posts = [],
  currentUser,
  universalViewerIndex = 0,
  onCloseCreatePost,
  onCloseEditPost,
  onCloseComments,
  onCloseImageViewer,
  onCloseShare,
  onSubmitPost,
  onUpdatePostComments,
  onReact,
  onComment,
  onShare,
  onBookmark
}) {
  const safePosts = Array.isArray(posts) ? posts : [];

  // ✅ Medien-Posts für Viewer vorfiltern
  const mediaPostsWithUsers = useMemo(() => {
    return safePosts.map(post => ({
      ...post,
      _hasMedia: post?.media_urls && post.media_urls.length > 0
    }));
  }, [safePosts]);

  return (
    <AnimatePresence mode="wait">
      {modals.createPost && (
        <CreatePost
          isOpen={true}
          onClose={onCloseCreatePost}
          onPostCreated={onSubmitPost}
          currentUser={currentUser}
        />
      )}

      {modals.editPost && modalData.editPost && (
        <CreatePost
          isOpen={true}
          onClose={onCloseEditPost}
          onPostCreated={onSubmitPost}
          currentUser={currentUser}
          editPost={modalData.editPost}
        />
      )}

      {modals.comments && modalData.comments && modalData.comments.id && (
        <CommentsModal
          isOpen={true}
          onClose={onCloseComments}
          post={modalData.comments}
          currentUser={currentUser}
          onCommentAdded={onUpdatePostComments}
        />
      )}

      {modals.share && modalData.share && (
        <ShareModal
          isOpen={true}
          onClose={onCloseShare}
          post={modalData.share}
        />
      )}

      {modals.imageViewer && mediaPostsWithUsers.length > 0 && mediaPostsWithUsers[universalViewerIndex] && (
        <UniversalSwipeViewer
          isOpen={true}
          onClose={onCloseImageViewer}
          posts={mediaPostsWithUsers}
          initialIndex={universalViewerIndex}
          users={{}}
          currentUser={currentUser}
          onReact={onReact}
          onComment={onComment}
          onShare={onShare}
          onBookmark={onBookmark}
        />
      )}
    </AnimatePresence>
  );
}