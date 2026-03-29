import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎯 RESOLVE TARGET USER
 * Findet User anhand von ID, Email, Username oder Handle
 * Optimiert für schnelle Profile-Lookups
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { target } = body;

    if (!target || typeof target !== 'string') {
      return Response.json({
        success: false,
        error: 'Target (ID, email, username or handle) required'
      }, { status: 400 });
    }

    console.log(`🎯 [ResolveTarget] Looking for: ${target}`);

    // ✅ Versuche verschiedene Lookups
    let user = null;

    // 1. Versuche als ID
    try {
      user = await base44.asServiceRole.entities.User.get(target);
      if (user) {
        console.log('✅ Found by ID');
      }
    } catch (idError) {
      console.log('Not found by ID');
    }

    // 2. Versuche als Email
    if (!user) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: target });
        if (users && users.length > 0) {
          user = users[0];
          console.log('✅ Found by email');
        }
      } catch (emailError) {
        console.log('Not found by email');
      }
    }

    // 3. Versuche als Username
    if (!user) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ username: target });
        if (users && users.length > 0) {
          user = users[0];
          console.log('✅ Found by username');
        }
      } catch (usernameError) {
        console.log('Not found by username');
      }
    }

    // 4. Versuche als Handle
    if (!user) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ handle: target });
        if (users && users.length > 0) {
          user = users[0];
          console.log('✅ Found by handle');
        }
      } catch (handleError) {
        console.log('Not found by handle');
      }
    }

    if (!user) {
      return Response.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ ResolveTarget error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});