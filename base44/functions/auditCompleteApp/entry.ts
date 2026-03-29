import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44 }) => {
  try {
    console.log('🔍 Starting complete app audit...');

    const auditResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'running',
      critical_issues: [],
      warnings: [],
      info: [],
      statistics: {},
      details: {}
    };

    // ========================================
    // 1️⃣ LIKES/REACTIONS SYSTEM AUDIT
    // ========================================
    console.log('📊 Auditing Likes/Reactions System...');
    
    try {
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 1000);
      
      let likesIssues = {
        posts_with_null_reactions: 0,
        posts_with_invalid_structure: 0,
        posts_with_negative_counts: 0,
        posts_checked: allPosts.length,
        fixed: []
      };

      for (const post of allPosts) {
        let needsUpdate = false;
        let updatedReactions = { ...post.reactions };

        // Check if reactions is null or undefined
        if (!post.reactions) {
          likesIssues.posts_with_null_reactions++;
          updatedReactions = {
            like: { count: 0, users: [] },
            fire: { count: 0, users: [] },
            laugh: { count: 0, users: [] },
            mind_blown: { count: 0, users: [] },
            helpful: { count: 0, users: [] },
            celebrate: { count: 0, users: [] }
          };
          needsUpdate = true;
        } else {
          // Check structure
          const reactionTypes = ['like', 'fire', 'laugh', 'mind_blown', 'helpful', 'celebrate'];
          
          for (const type of reactionTypes) {
            if (!updatedReactions[type]) {
              updatedReactions[type] = { count: 0, users: [] };
              needsUpdate = true;
              likesIssues.posts_with_invalid_structure++;
            } else {
              // Validate count and users array
              if (typeof updatedReactions[type].count !== 'number') {
                updatedReactions[type].count = 0;
                needsUpdate = true;
              }
              
              if (!Array.isArray(updatedReactions[type].users)) {
                updatedReactions[type].users = [];
                needsUpdate = true;
              }

              // Check for negative counts
              if (updatedReactions[type].count < 0) {
                updatedReactions[type].count = 0;
                needsUpdate = true;
                likesIssues.posts_with_negative_counts++;
              }

              // Sync count with users array length
              if (updatedReactions[type].count !== updatedReactions[type].users.length) {
                updatedReactions[type].count = updatedReactions[type].users.length;
                needsUpdate = true;
              }
            }
          }
        }

        // Update post if needed
        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Post.update(post.id, {
              reactions: updatedReactions
            });
            likesIssues.fixed.push(post.id);
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'likes',
              message: `Failed to fix post ${post.id}: ${updateError.message}`
            });
          }
        }
      }

      auditResults.details.likes_system = likesIssues;
      
      if (likesIssues.posts_with_null_reactions > 0 || 
          likesIssues.posts_with_invalid_structure > 0 || 
          likesIssues.posts_with_negative_counts > 0) {
        auditResults.warnings.push({
          category: 'likes',
          message: `Found and fixed ${likesIssues.fixed.length} posts with reaction issues`
        });
      } else {
        auditResults.info.push({
          category: 'likes',
          message: '✅ All post reactions are valid'
        });
      }

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'likes',
        message: `Failed to audit likes: ${error.message}`
      });
    }

    // ========================================
    // 2️⃣ USERS AUDIT
    // ========================================
    console.log('👥 Auditing Users...');
    
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 1000);
      
      let userIssues = {
        users_without_username: 0,
        users_with_invalid_followers: 0,
        users_with_negative_counts: 0,
        users_checked: allUsers.length,
        fixed: []
      };

      for (const checkUser of allUsers) {
        let needsUpdate = false;
        let updates = {};

        // Check username
        if (!checkUser.username || checkUser.username.trim() === '') {
          updates.username = checkUser.email.split('@')[0];
          userIssues.users_without_username++;
          needsUpdate = true;
        }

        // Check followers/following arrays
        if (!Array.isArray(checkUser.followers)) {
          updates.followers = [];
          userIssues.users_with_invalid_followers++;
          needsUpdate = true;
        }
        
        if (!Array.isArray(checkUser.following)) {
          updates.following = [];
          userIssues.users_with_invalid_followers++;
          needsUpdate = true;
        }

        // Check counts
        const actualFollowersCount = Array.isArray(checkUser.followers) ? checkUser.followers.length : 0;
        const actualFollowingCount = Array.isArray(checkUser.following) ? checkUser.following.length : 0;

        if (checkUser.followers_count !== actualFollowersCount) {
          updates.followers_count = actualFollowersCount;
          needsUpdate = true;
        }

        if (checkUser.following_count !== actualFollowingCount) {
          updates.following_count = actualFollowingCount;
          needsUpdate = true;
        }

        // Check for negative counts
        if (checkUser.xp < 0) {
          updates.xp = 0;
          userIssues.users_with_negative_counts++;
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.User.update(checkUser.id, updates);
            userIssues.fixed.push(checkUser.id);
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'users',
              message: `Failed to fix user ${checkUser.id}: ${updateError.message}`
            });
          }
        }
      }

      auditResults.details.users = userIssues;
      
      if (userIssues.fixed.length > 0) {
        auditResults.warnings.push({
          category: 'users',
          message: `Fixed ${userIssues.fixed.length} users with data issues`
        });
      } else {
        auditResults.info.push({
          category: 'users',
          message: '✅ All users have valid data'
        });
      }

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'users',
        message: `Failed to audit users: ${error.message}`
      });
    }

    // ========================================
    // 3️⃣ COMMENTS AUDIT
    // ========================================
    console.log('💬 Auditing Comments...');
    
    try {
      const allComments = await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 1000);
      const allCommentReactions = await base44.asServiceRole.entities.CommentReaction.filter({}, '-created_date', 2000);
      
      let commentIssues = {
        comments_with_null_reactions: 0,
        comments_with_orphaned_reactions: 0,
        reactions_without_comment: 0,
        comments_checked: allComments.length,
        fixed: []
      };

      const commentIds = new Set(allComments.map(c => c.id));

      // Check orphaned reactions
      for (const reaction of allCommentReactions) {
        if (!commentIds.has(reaction.comment_id)) {
          commentIssues.reactions_without_comment++;
          try {
            await base44.asServiceRole.entities.CommentReaction.delete(reaction.id);
          } catch (e) {
            console.warn('Failed to delete orphaned reaction:', e);
          }
        }
      }

      // Build reaction map
      const reactionsByComment = {};
      for (const reaction of allCommentReactions) {
        if (!reactionsByComment[reaction.comment_id]) {
          reactionsByComment[reaction.comment_id] = [];
        }
        reactionsByComment[reaction.comment_id].push(reaction);
      }

      // Check each comment
      for (const comment of allComments) {
        let needsUpdate = false;
        let updatedReactions = comment.reactions || { total: 0, byType: {} };

        const actualReactions = reactionsByComment[comment.id] || [];
        const actualTotal = actualReactions.length;

        const actualByType = {};
        for (const r of actualReactions) {
          if (!actualByType[r.reaction_type]) {
            actualByType[r.reaction_type] = { count: 0, users: [] };
          }
          actualByType[r.reaction_type].count++;
          actualByType[r.reaction_type].users.push(r.user_email);
        }

        // Compare and update
        if (updatedReactions.total !== actualTotal) {
          updatedReactions.total = actualTotal;
          needsUpdate = true;
        }

        if (JSON.stringify(updatedReactions.byType) !== JSON.stringify(actualByType)) {
          updatedReactions.byType = actualByType;
          needsUpdate = true;
        }

        if (!comment.reactions) {
          commentIssues.comments_with_null_reactions++;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Comment.update(comment.id, {
              reactions: updatedReactions
            });
            commentIssues.fixed.push(comment.id);
          } catch (updateError) {
            console.warn('Failed to fix comment:', updateError);
          }
        }
      }

      auditResults.details.comments = commentIssues;
      
      if (commentIssues.fixed.length > 0 || commentIssues.reactions_without_comment > 0) {
        auditResults.warnings.push({
          category: 'comments',
          message: `Fixed ${commentIssues.fixed.length} comments, removed ${commentIssues.reactions_without_comment} orphaned reactions`
        });
      } else {
        auditResults.info.push({
          category: 'comments',
          message: '✅ All comments have valid reactions'
        });
      }

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'comments',
        message: `Failed to audit comments: ${error.message}`
      });
    }

    // ========================================
    // 4️⃣ GROW DIARIES AUDIT
    // ========================================
    console.log('🌱 Auditing Grow Diaries...');
    
    try {
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({}, '-created_date', 500);
      const allEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({}, '-created_date', 2000);
      
      let diaryIssues = {
        diaries_without_stats: 0,
        diaries_with_wrong_stats: 0,
        entries_without_diary: 0,
        diaries_checked: allDiaries.length,
        fixed: []
      };

      const diaryIds = new Set(allDiaries.map(d => d.id));

      // Check orphaned entries
      for (const entry of allEntries) {
        if (!diaryIds.has(entry.diary_id)) {
          diaryIssues.entries_without_diary++;
        }
      }

      // Check each diary
      for (const diary of allDiaries) {
        let needsUpdate = false;
        let updates = {};

        const diaryEntries = allEntries.filter(e => e.diary_id === diary.id);
        
        const actualStats = {
          total_days: diaryEntries.length > 0 ? Math.max(...diaryEntries.map(e => e.day_number || 0)) : 0,
          total_entries: diaryEntries.length,
          total_photos: diaryEntries.reduce((sum, e) => sum + (e.media_urls?.length || 0), 0)
        };

        if (!diary.stats) {
          updates.stats = actualStats;
          diaryIssues.diaries_without_stats++;
          needsUpdate = true;
        } else if (
          diary.stats.total_days !== actualStats.total_days ||
          diary.stats.total_entries !== actualStats.total_entries ||
          diary.stats.total_photos !== actualStats.total_photos
        ) {
          updates.stats = { ...diary.stats, ...actualStats };
          diaryIssues.diaries_with_wrong_stats++;
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.GrowDiary.update(diary.id, updates);
            diaryIssues.fixed.push(diary.id);
          } catch (updateError) {
            console.warn('Failed to fix diary:', updateError);
          }
        }
      }

      auditResults.details.grow_diaries = diaryIssues;
      
      if (diaryIssues.fixed.length > 0 || diaryIssues.entries_without_diary > 0) {
        auditResults.warnings.push({
          category: 'grow_diaries',
          message: `Fixed ${diaryIssues.fixed.length} diaries, found ${diaryIssues.entries_without_diary} orphaned entries`
        });
      } else {
        auditResults.info.push({
          category: 'grow_diaries',
          message: '✅ All grow diaries have valid stats'
        });
      }

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'grow_diaries',
        message: `Failed to audit grow diaries: ${error.message}`
      });
    }

    // ========================================
    // 5️⃣ POSTS INTEGRITY AUDIT
    // ========================================
    console.log('📝 Auditing Posts Integrity...');
    
    try {
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 1000);
      
      let postIssues = {
        posts_with_null_tags: 0,
        posts_with_invalid_tags: 0,
        posts_with_broken_media: 0,
        posts_checked: allPosts.length,
        fixed: []
      };

      for (const post of allPosts) {
        let needsUpdate = false;
        let updates = {};

        // Check tags
        if (!post.tags) {
          updates.tags = [];
          postIssues.posts_with_null_tags++;
          needsUpdate = true;
        } else if (Array.isArray(post.tags)) {
          const validTags = post.tags.filter(tag => tag != null && tag !== '' && typeof tag === 'string');
          if (validTags.length !== post.tags.length) {
            updates.tags = validTags;
            postIssues.posts_with_invalid_tags++;
            needsUpdate = true;
          }
        }

        // Check media_urls
        if (!Array.isArray(post.media_urls)) {
          updates.media_urls = [];
          postIssues.posts_with_broken_media++;
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Post.update(post.id, updates);
            postIssues.fixed.push(post.id);
          } catch (updateError) {
            console.warn('Failed to fix post:', updateError);
          }
        }
      }

      auditResults.details.posts = postIssues;
      
      if (postIssues.fixed.length > 0) {
        auditResults.warnings.push({
          category: 'posts',
          message: `Fixed ${postIssues.fixed.length} posts with data issues`
        });
      } else {
        auditResults.info.push({
          category: 'posts',
          message: '✅ All posts have valid data'
        });
      }

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'posts',
        message: `Failed to audit posts: ${error.message}`
      });
    }

    // ========================================
    // 6️⃣ STATISTICS
    // ========================================
    console.log('📈 Gathering Statistics...');
    
    try {
      const stats = {
        total_users: (await base44.asServiceRole.entities.User.filter({}, '-created_date', 10000)).length,
        total_posts: (await base44.asServiceRole.entities.Post.filter({}, '-created_date', 10000)).length,
        total_comments: (await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 10000)).length,
        total_diaries: (await base44.asServiceRole.entities.GrowDiary.filter({}, '-created_date', 5000)).length,
        total_products: (await base44.asServiceRole.entities.Product.filter({}, '-created_date', 5000)).length,
      };

      auditResults.statistics = stats;

    } catch (error) {
      auditResults.warnings.push({
        category: 'statistics',
        message: `Failed to gather some statistics: ${error.message}`
      });
    }

    // ========================================
    // FINAL STATUS
    // ========================================
    if (auditResults.critical_issues.length > 0) {
      auditResults.overall_status = 'critical';
    } else if (auditResults.warnings.length > 0) {
      auditResults.overall_status = 'warning';
    } else {
      auditResults.overall_status = 'healthy';
    }

    console.log('✅ Audit completed!');

    return Response.json(auditResults);

  } catch (error) {
    console.error('❌ Audit failed:', error);
    
    return Response.json({
      error: 'audit_failed',
      message: error.message,
      overall_status: 'failed'
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['admin', 'moderator'],
  rateLimit: RATE_LIMITS.search,
  maxBodySizeKB: 64
}));