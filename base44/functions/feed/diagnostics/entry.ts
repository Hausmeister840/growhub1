import { secureWrapper } from '../../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../../_shared/rateLimiter.js';

/**
 * 🔍 ERWEITERTE FEED DIAGNOSTICS
 * Analysiert alle möglichen Fehlerquellen im Feed
 */

Deno.serve(secureWrapper(async (req, { base44, user }) => {
  try {
    console.log('🔍 Starting Enhanced Feed Diagnostics...');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      user_authenticated: !!user,
      checks: []
    };

    // ✅ CHECK 1: Posts mit Media URLs
    try {
      const posts = await base44.asServiceRole.entities.Post.filter(
        { visibility: 'public' },
        '-created_date',
        50
      );

      const postsWithMedia = posts.filter(p => p.media_urls && p.media_urls.length > 0);
      const postsWithoutMedia = posts.filter(p => !p.media_urls || p.media_urls.length === 0);
      
      const invalidMediaUrls = [];
      const validMediaUrls = [];
      const mediaUrlPatterns = {
        images: 0,
        videos: 0,
        other: 0
      };

      postsWithMedia.forEach(post => {
        if (post.media_urls && Array.isArray(post.media_urls)) {
          post.media_urls.forEach(url => {
            if (!url || typeof url !== 'string' || url.trim() === '') {
              invalidMediaUrls.push({ post_id: post.id, url, reason: 'empty or invalid' });
            } else {
              validMediaUrls.push(url);
              
              // Pattern analysis
              if (/\.(jpg|jpeg|png|gif|webp)($|\?)/i.test(url)) {
                mediaUrlPatterns.images++;
              } else if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(url)) {
                mediaUrlPatterns.videos++;
              } else {
                mediaUrlPatterns.other++;
              }
            }
          });
        }
      });

      diagnostics.checks.push({
        name: 'Media URLs Check',
        status: invalidMediaUrls.length === 0 ? 'pass' : 'warning',
        details: {
          total_posts: posts.length,
          posts_with_media: postsWithMedia.length,
          posts_without_media: postsWithoutMedia.length,
          total_media_urls: validMediaUrls.length,
          invalid_media_urls: invalidMediaUrls.length,
          media_patterns: mediaUrlPatterns,
          invalid_samples: invalidMediaUrls.slice(0, 10),
          sample_valid_urls: validMediaUrls.slice(0, 5)
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'Media URLs Check',
        status: 'error',
        error: error.message
      });
    }

    // ✅ CHECK 2: URL Accessibility Test
    try {
      const posts = await base44.asServiceRole.entities.Post.filter(
        { visibility: 'public' },
        '-created_date',
        10
      );

      const urlTests = [];
      
      for (const post of posts) {
        if (post.media_urls && post.media_urls.length > 0) {
          for (const url of post.media_urls.slice(0, 2)) {
            try {
              const response = await fetch(url, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
              });
              urlTests.push({
                url: url.substring(0, 100),
                status: response.status,
                ok: response.ok,
                content_type: response.headers.get('content-type'),
                post_id: post.id
              });
            } catch (error) {
              urlTests.push({
                url: url.substring(0, 100),
                status: 'error',
                ok: false,
                error: error.message,
                post_id: post.id
              });
            }
          }
        }
      }

      const failedUrls = urlTests.filter(t => !t.ok);
      
      diagnostics.checks.push({
        name: 'URL Accessibility Test',
        status: failedUrls.length === 0 ? 'pass' : 'critical',
        details: {
          total_tested: urlTests.length,
          successful: urlTests.filter(t => t.ok).length,
          failed: failedUrls.length,
          failed_samples: failedUrls.slice(0, 5),
          all_results: urlTests
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'URL Accessibility Test',
        status: 'error',
        error: error.message
      });
    }

    // ✅ CHECK 3: Video Posts
    try {
      const posts = await base44.asServiceRole.entities.Post.filter(
        { visibility: 'public' },
        '-created_date',
        100
      );

      const videoPosts = posts.filter(p => 
        p.media_urls && p.media_urls.some(url => 
          /\.(mp4|webm|ogg|mov)($|\?)/i.test(url)
        )
      );

      const videoStats = {
        total_video_posts: videoPosts.length,
        by_extension: {
          mp4: 0,
          webm: 0,
          mov: 0,
          other: 0
        }
      };

      videoPosts.forEach(post => {
        post.media_urls.forEach(url => {
          if (/\.mp4($|\?)/i.test(url)) videoStats.by_extension.mp4++;
          else if (/\.webm($|\?)/i.test(url)) videoStats.by_extension.webm++;
          else if (/\.mov($|\?)/i.test(url)) videoStats.by_extension.mov++;
          else if (/\.(ogg|avi)($|\?)/i.test(url)) videoStats.by_extension.other++;
        });
      });

      diagnostics.checks.push({
        name: 'Video Posts Check',
        status: 'pass',
        details: {
          total_posts_checked: posts.length,
          ...videoStats,
          percentage: ((videoPosts.length / posts.length) * 100).toFixed(2) + '%',
          sample_video_posts: videoPosts.slice(0, 3).map(p => ({
            id: p.id,
            media_urls: p.media_urls
          }))
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'Video Posts Check',
        status: 'error',
        error: error.message
      });
    }

    // ✅ CHECK 4: User Data Completeness
    try {
      const posts = await base44.asServiceRole.entities.Post.filter(
        { visibility: 'public' },
        '-created_date',
        20
      );

      const userEmails = [...new Set(posts.map(p => p.created_by))];
      const users = await base44.asServiceRole.entities.User.filter({
        email: { '$in': userEmails }
      });

      const missingUsers = userEmails.filter(email => 
        !users.find(u => u.email === email)
      );

      diagnostics.checks.push({
        name: 'User Data Completeness',
        status: missingUsers.length === 0 ? 'pass' : 'warning',
        details: {
          total_unique_authors: userEmails.length,
          users_found: users.length,
          users_missing: missingUsers.length,
          missing_samples: missingUsers.slice(0, 5)
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'User Data Completeness',
        status: 'error',
        error: error.message
      });
    }

    // ✅ CHECK 5: Feed Performance
    try {
      const start = Date.now();
      const posts = await base44.asServiceRole.entities.Post.filter(
        { visibility: 'public' },
        '-created_date',
        20
      );
      const duration = Date.now() - start;

      diagnostics.checks.push({
        name: 'Feed Performance',
        status: duration < 1000 ? 'pass' : duration < 3000 ? 'warning' : 'error',
        details: {
          load_time_ms: duration,
          posts_loaded: posts.length,
          avg_time_per_post: (duration / posts.length).toFixed(2) + 'ms'
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'Feed Performance',
        status: 'error',
        error: error.message
      });
    }

    // ✅ Summary
    const passCount = diagnostics.checks.filter(c => c.status === 'pass').length;
    const warningCount = diagnostics.checks.filter(c => c.status === 'warning').length;
    const errorCount = diagnostics.checks.filter(c => c.status === 'error').length;
    const criticalCount = diagnostics.checks.filter(c => c.status === 'critical').length;

    diagnostics.summary = {
      total_checks: diagnostics.checks.length,
      passed: passCount,
      warnings: warningCount,
      errors: errorCount,
      critical: criticalCount,
      overall_status: criticalCount > 0 ? 'critical' : errorCount > 0 ? 'error' : warningCount > 0 ? 'needs_attention' : 'healthy'
    };

    console.log('✅ Diagnostics Complete:', diagnostics.summary);

    return Response.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    console.error('❌ Diagnostics Error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: Deno.env.get('ENVIRONMENT') === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['admin', 'moderator'],
  rateLimit: RATE_LIMITS.search,
  maxBodySizeKB: 64
}));