import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, data } = await req.json();
    if (!conversationId || !data) {
      return Response.json({ error: 'Missing conversationId or data' }, { status: 400 });
    }

    // Verify user is participant
    const conversation = await base44.asServiceRole.entities.Conversation.get(conversationId);
    if (!conversation || !conversation.participants?.includes(user.id)) {
      return Response.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Only allow controlled metadata updates from participants.
    const ALLOWED_FIELDS = new Set([
      'name',
      'avatar',
      'description',
      'lastMessage',
      'unreadCount',
      'isPinned',
      'isMuted',
      'isArchived'
    ]);
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_FIELDS.has(key)) sanitized[key] = value;
    }
    if (Object.keys(sanitized).length === 0) {
      return Response.json({ error: 'No allowed fields to update' }, { status: 400 });
    }

    // unreadCount must only contain participant keys with integer values
    if (sanitized.unreadCount && typeof sanitized.unreadCount === 'object') {
      const constrainedUnread = {};
      for (const participantId of (conversation.participants || [])) {
        const raw = sanitized.unreadCount[participantId];
        const count = Number.isFinite(Number(raw)) ? Math.max(0, Math.floor(Number(raw))) : 0;
        constrainedUnread[participantId] = count;
      }
      sanitized.unreadCount = constrainedUnread;
    }

    await base44.asServiceRole.entities.Conversation.update(conversationId, sanitized);

    return Response.json({ success: true });
  } catch (error) {
    console.error('updateConversation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});