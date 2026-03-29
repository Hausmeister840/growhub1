import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✏️ UPDATE PROFILE - SINGLE SOURCE
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    // Prevent updating protected fields
    const protectedFields = ['id', 'email', 'role', 'created_date', 'updated_date'];
    protectedFields.forEach(field => delete updates[field]);

    // Update handle if username changed
    if (updates.username && updates.username !== user.username) {
      updates.handle = `@${updates.username}`;
    }

    await base44.asServiceRole.entities.User.update(user.id, updates);

    return Response.json({ ok: true });

  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});