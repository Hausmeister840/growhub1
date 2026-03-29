import { useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import PostCard from './PostCard';
import { PostSkeleton } from '../ui/LoadingStates';

export default function VirtualizedFeedList({
  posts,
  users,
  currentUser,
  hasMore,
  isLoading,
  onLoadMore,
  onReact,
  onBookmark,
  onDelete,
  onCommentClick,
  onMediaClick,
  onEdit,
  onReport,
  onShare
}) {
  const listRef = useRef(null);

  // Item count for infinite loader
  const itemCount = hasMore ? posts.length + 1 : posts.length;

  // Check if item is loaded
  const isItemLoaded = useCallback((index) => {
    return !hasMore || index < posts.length;
  }, [hasMore, posts.length]);

  // Load more items
  const loadMoreItems = useCallback(() => {
    if (isLoading || !hasMore) return Promise.resolve();
    return onLoadMore();
  }, [isLoading, hasMore, onLoadMore]);

  // Render individual post item
  const Row = useCallback(({ index, style }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style}>
          <PostSkeleton />
        </div>
      );
    }

    const post = posts[index];
    if (!post || !post.id) return null;

    const postUser = users[post.created_by] || users[post.created_by_id] || {
      email: post.created_by,
      full_name: post.created_by?.split('@')[0] || 'User',
      username: post.created_by?.split('@')[0] || 'user'
    };

    return (
      <div style={style}>
        <PostCard
          post={post}
          user={postUser}
          currentUser={currentUser}
          onReact={onReact}
          onBookmark={onBookmark}
          onDelete={onDelete}
          onCommentClick={onCommentClick}
          onMediaClick={onMediaClick}
          onEdit={onEdit}
          onReport={onReport}
          onShare={onShare}
          priority={index < 3}
        />
      </div>
    );
  }, [posts, users, currentUser, isItemLoaded, onReact, onBookmark, onDelete, onCommentClick, onMediaClick, onEdit, onReport, onShare]);

  // Calculate item size (average post height)
  const itemSize = 600;

  // Get window dimensions
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
      threshold={3}
    >
      {({ onItemsRendered, ref }) => (
        <List
          ref={(list) => {
            ref(list);
            listRef.current = list;
          }}
          height={height}
          itemCount={itemCount}
          itemSize={itemSize}
          onItemsRendered={onItemsRendered}
          width="100%"
          overscanCount={2}
          className="feed-virtual-list"
        >
          {Row}
        </List>
      )}
    </InfiniteLoader>
  );
}