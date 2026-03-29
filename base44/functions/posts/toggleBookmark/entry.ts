import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { postId, bookmarked } = await req.clone().json();
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: 'Missing postId' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.Post.get(postId).catch(() => null);

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const bookmarkedBy = post.bookmarked_by_users || [];
    const isBookmarked = bookmarkedBy.includes(user.email);

    // If bookmarked param is provided, use it; otherwise toggle
    let updatedBookmarks;
    if (bookmarked === undefined) {
     updatedBookmarks = isBookmarked
       ? bookmarkedBy.filter(e => e !== user.email)
       : [...bookmarkedBy, user.email];
    } else {
     updatedBookmarks = bookmarked
       ? [...new Set([...bookmarkedBy, user.email])]
       : bookmarkedBy.filter(e => e !== user.email);
    }

    await base44.asServiceRole.entities.Post.update(postId, {
      bookmarked_by_users: updatedBookmarks
    });

    return Response.json({
      success: true,
      isBookmarked: !isBookmarked,
      bookmarked_by_users: updatedBookmarks
    });

  } catch (error) {
    console.error('Toggle bookmark error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});