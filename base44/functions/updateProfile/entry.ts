import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✏️ UPDATE PROFILE - PRODUCTION READY
 * Aktualisiert User-Profil mit Validierung
 */

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.id) {
      return Response.json({
        ok: false,
        error: 'Authentication required',
        message: 'Bitte melde dich an'
      }, { status: 401 });
    }

    const updates = await req.json();
    console.log('✏️ Updating profile:', user.email, Object.keys(updates));

    // ✅ Allowed fields
    const allowedFields = [
      'username', 'handle', 'bio', 'avatar_url', 'banner_url',
      'location', 'website_url', 'links', 'interests',
      'privacy_mode', 'grow_level', 'preferences'
    ];

    // ✅ Filter updates
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        cleanUpdates[key] = value;
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return Response.json({
        ok: false,
        error: 'No valid fields to update',
        message: 'Keine gültigen Felder zum Aktualisieren'
      }, { status: 400 });
    }

    // ✅ Validate username
    if (cleanUpdates.username) {
      const username = cleanUpdates.username.trim();
      
      if (username.length < 3 || username.length > 20) {
        return Response.json({
          ok: false,
          error: 'Invalid username length',
          message: 'Username muss 3-20 Zeichen lang sein'
        }, { status: 400 });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return Response.json({
          ok: false,
          error: 'Invalid username format',
          message: 'Username darf nur Buchstaben, Zahlen und _ enthalten'
        }, { status: 400 });
      }

      // Check uniqueness
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        username: username.toLowerCase()
      });

      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        return Response.json({
          ok: false,
          error: 'Username taken',
          message: 'Username bereits vergeben'
        }, { status: 400 });
      }

      cleanUpdates.username = username;
    }

    // ✅ Validate handle
    if (cleanUpdates.handle) {
      const handle = cleanUpdates.handle.trim();
      
      if (handle.length < 3 || handle.length > 20) {
        return Response.json({
          ok: false,
          error: 'Invalid handle length',
          message: 'Handle muss 3-20 Zeichen lang sein'
        }, { status: 400 });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        return Response.json({
          ok: false,
          error: 'Invalid handle format',
          message: 'Handle darf nur Buchstaben, Zahlen und _ enthalten'
        }, { status: 400 });
      }

      // Check uniqueness
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        handle: handle.toLowerCase()
      });

      if (existingUsers.length > 0 && existingUsers[0].id !== user.id) {
        return Response.json({
          ok: false,
          error: 'Handle taken',
          message: 'Handle bereits vergeben'
        }, { status: 400 });
      }

      cleanUpdates.handle = handle;
    }

    // ✅ Validate bio
    if (cleanUpdates.bio !== undefined) {
      if (cleanUpdates.bio && cleanUpdates.bio.length > 280) {
        return Response.json({
          ok: false,
          error: 'Bio too long',
          message: 'Bio darf maximal 280 Zeichen haben'
        }, { status: 400 });
      }
    }

    // ✅ Validate website URL
    if (cleanUpdates.website_url) {
      try {
        new URL(cleanUpdates.website_url);
      } catch {
        return Response.json({
          ok: false,
          error: 'Invalid website URL',
          message: 'Ungültige Website-URL'
        }, { status: 400 });
      }
    }

    // ✅ Validate links
    if (cleanUpdates.links && Array.isArray(cleanUpdates.links)) {
      for (const link of cleanUpdates.links) {
        try {
          new URL(link);
        } catch {
          return Response.json({
            ok: false,
            error: 'Invalid link',
            message: `Ungültiger Link: ${link}`
          }, { status: 400 });
        }
      }
    }

    // ✅ Validate privacy mode
    if (cleanUpdates.privacy_mode) {
      const validModes = ['public', 'followers', 'private'];
      if (!validModes.includes(cleanUpdates.privacy_mode)) {
        return Response.json({
          ok: false,
          error: 'Invalid privacy mode',
          message: 'Ungültiger Privacy-Modus'
        }, { status: 400 });
      }
    }

    // ✅ Update user
    try {
      const updatedUser = await base44.asServiceRole.entities.User.update(
        user.id,
        cleanUpdates
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Profile updated in ${duration}ms`);

      return Response.json({
        ok: true,
        message: 'Profil aktualisiert',
        data: {
          user: updatedUser
        }
      });

    } catch (error) {
      console.error('❌ Error updating user:', error);
      
      return Response.json({
        ok: false,
        error: 'Update failed',
        message: 'Update fehlgeschlagen',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Profile update error after ${duration}ms:`, error);

    return Response.json({
      ok: false,
      error: 'Internal error',
      message: 'Interner Fehler',
      details: error.message
    }, { status: 500 });
  }
});