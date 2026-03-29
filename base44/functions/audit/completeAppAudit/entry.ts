import { secureWrapper } from '../_shared/secureWrapper.js';
import { RATE_LIMITS } from '../_shared/rateLimiter.js';

Deno.serve(secureWrapper(async (req, { base44 }) => {
  try {
    console.log('🔍 STARTING COMPLETE GROWHUB AUDIT...');
    console.log('═══════════════════════════════════════════════════════════');

    const auditResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'running',
      score: 0,
      max_score: 1000,
      critical_issues: [],
      warnings: [],
      recommendations: [],
      statistics: {},
      detailed_reports: {}
    };

    // ========================================
    // 1️⃣ ENTITIES & DATA INTEGRITY
    // ========================================
    console.log('\n📊 AUDITING ENTITIES & DATA INTEGRITY...');
    
    const entityAudit = {
      posts: { checked: 0, issues: 0, fixed: 0 },
      users: { checked: 0, issues: 0, fixed: 0 },
      comments: { checked: 0, issues: 0, fixed: 0 },
      growDiaries: { checked: 0, issues: 0, fixed: 0 },
      growDiaryEntries: { checked: 0, issues: 0, fixed: 0 },
      conversations: { checked: 0, issues: 0, fixed: 0 },
      messages: { checked: 0, issues: 0, fixed: 0 }
    };

    // === POSTS AUDIT ===
    try {
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 5000);
      entityAudit.posts.checked = allPosts.length;

      for (const post of allPosts) {
        let needsUpdate = false;
        let updates = {};

        // Check reactions structure
        if (!post.reactions || typeof post.reactions !== 'object') {
          updates.reactions = {
            like: { count: 0, users: [] },
            fire: { count: 0, users: [] },
            laugh: { count: 0, users: [] },
            mind_blown: { count: 0, users: [] },
            helpful: { count: 0, users: [] },
            celebrate: { count: 0, users: [] }
          };
          needsUpdate = true;
          entityAudit.posts.issues++;
        } else {
          // Validate each reaction type
          const reactionTypes = ['like', 'fire', 'laugh', 'mind_blown', 'helpful', 'celebrate'];
          let reactionsFixed = false;
          
          for (const type of reactionTypes) {
            if (!post.reactions[type]) {
              if (!updates.reactions) updates.reactions = { ...post.reactions };
              updates.reactions[type] = { count: 0, users: [] };
              reactionsFixed = true;
            } else {
              // Validate structure
              if (typeof post.reactions[type].count !== 'number' || !Array.isArray(post.reactions[type].users)) {
                if (!updates.reactions) updates.reactions = { ...post.reactions };
                updates.reactions[type] = {
                  count: post.reactions[type].users?.length || 0,
                  users: Array.isArray(post.reactions[type].users) ? post.reactions[type].users : []
                };
                reactionsFixed = true;
              }
              
              // Sync count with users
              if (post.reactions[type].count !== post.reactions[type].users.length) {
                if (!updates.reactions) updates.reactions = { ...post.reactions };
                updates.reactions[type].count = post.reactions[type].users.length;
                reactionsFixed = true;
              }
            }
          }
          
          if (reactionsFixed) {
            needsUpdate = true;
            entityAudit.posts.issues++;
          }
        }

        // Check required fields
        if (!post.content && (!post.media_urls || post.media_urls.length === 0)) {
          auditResults.warnings.push({
            category: 'posts',
            severity: 'medium',
            message: `Post ${post.id} has no content or media`
          });
          entityAudit.posts.issues++;
        }

        // Validate media URLs
        if (post.media_urls && Array.isArray(post.media_urls)) {
          const validUrls = post.media_urls.filter(url => 
            url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
          );
          if (validUrls.length !== post.media_urls.length) {
            updates.media_urls = validUrls;
            needsUpdate = true;
            entityAudit.posts.issues++;
          }
        }

        // Check visibility
        if (!['public', 'friends', 'private'].includes(post.visibility)) {
          updates.visibility = 'public';
          needsUpdate = true;
          entityAudit.posts.issues++;
        }

        // Validate counters
        if (typeof post.comments_count !== 'number' || post.comments_count < 0) {
          updates.comments_count = 0;
          needsUpdate = true;
        }

        if (typeof post.view_count !== 'number' || post.view_count < 0) {
          updates.view_count = 0;
          needsUpdate = true;
        }

        // Update if needed
        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Post.update(post.id, updates);
            entityAudit.posts.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'posts',
              severity: 'high',
              message: `Failed to fix post ${post.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Posts: ${entityAudit.posts.checked} checked, ${entityAudit.posts.issues} issues, ${entityAudit.posts.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'posts',
        message: `Failed to audit posts: ${error.message}`
      });
    }

    // === USERS AUDIT ===
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 5000);
      entityAudit.users.checked = allUsers.length;

      for (const userRecord of allUsers) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!userRecord.username) {
          updates.username = userRecord.email?.split('@')[0] || `user_${userRecord.id.substring(0, 8)}`;
          needsUpdate = true;
          entityAudit.users.issues++;
        }

        // Validate arrays
        if (!Array.isArray(userRecord.followers)) {
          updates.followers = [];
          needsUpdate = true;
          entityAudit.users.issues++;
        }

        if (!Array.isArray(userRecord.following)) {
          updates.following = [];
          needsUpdate = true;
          entityAudit.users.issues++;
        }

        if (!Array.isArray(userRecord.badges)) {
          updates.badges = [];
          needsUpdate = true;
        }

        // Validate counts
        if (typeof userRecord.followers_count !== 'number') {
          updates.followers_count = userRecord.followers?.length || 0;
          needsUpdate = true;
        }

        if (typeof userRecord.following_count !== 'number') {
          updates.following_count = userRecord.following?.length || 0;
          needsUpdate = true;
        }

        // XP validation
        if (typeof userRecord.xp !== 'number' || userRecord.xp < 0) {
          updates.xp = 0;
          needsUpdate = true;
        }

        // Coins validation
        if (typeof userRecord.coins !== 'number' || userRecord.coins < 0) {
          updates.coins = 0;
          needsUpdate = true;
        }

        // Update if needed
        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.User.update(userRecord.id, updates);
            entityAudit.users.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'users',
              severity: 'high',
              message: `Failed to fix user ${userRecord.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Users: ${entityAudit.users.checked} checked, ${entityAudit.users.issues} issues, ${entityAudit.users.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'users',
        message: `Failed to audit users: ${error.message}`
      });
    }

    // === COMMENTS AUDIT ===
    try {
      const allComments = await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 10000);
      entityAudit.comments.checked = allComments.length;

      for (const comment of allComments) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!comment.content || comment.content.trim() === '') {
          auditResults.warnings.push({
            category: 'comments',
            severity: 'medium',
            message: `Comment ${comment.id} has empty content`
          });
          entityAudit.comments.issues++;
        }

        if (!comment.post_id) {
          auditResults.warnings.push({
            category: 'comments',
            severity: 'high',
            message: `Comment ${comment.id} has no post_id - orphaned comment`
          });
          entityAudit.comments.issues++;
        }

        if (!comment.author_email) {
          auditResults.warnings.push({
            category: 'comments',
            severity: 'high',
            message: `Comment ${comment.id} has no author_email`
          });
          entityAudit.comments.issues++;
        }

        // Validate reactions
        if (!comment.reactions || typeof comment.reactions !== 'object') {
          updates.reactions = { total: 0, byType: {} };
          needsUpdate = true;
          entityAudit.comments.issues++;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Comment.update(comment.id, updates);
            entityAudit.comments.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'comments',
              severity: 'medium',
              message: `Failed to fix comment ${comment.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Comments: ${entityAudit.comments.checked} checked, ${entityAudit.comments.issues} issues, ${entityAudit.comments.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'comments',
        message: `Failed to audit comments: ${error.message}`
      });
    }

    // === GROW DIARIES AUDIT ===
    try {
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({}, '-start_date', 2000);
      entityAudit.growDiaries.checked = allDiaries.length;

      for (const diary of allDiaries) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!diary.name) {
          updates.name = `Grow ${diary.id.substring(0, 8)}`;
          needsUpdate = true;
          entityAudit.growDiaries.issues++;
        }

        if (!diary.strain_name) {
          updates.strain_name = 'Unknown Strain';
          needsUpdate = true;
          entityAudit.growDiaries.issues++;
        }

        // Validate status
        if (!['active', 'completed', 'archived', 'problem'].includes(diary.status)) {
          updates.status = 'active';
          needsUpdate = true;
          entityAudit.growDiaries.issues++;
        }

        // Validate current_stage
        const validStages = ['Keimung', 'Sämling', 'Wachstum', 'Blüte', 'Spülung', 'Ernte'];
        if (!validStages.includes(diary.current_stage)) {
          updates.current_stage = 'Keimung';
          needsUpdate = true;
          entityAudit.growDiaries.issues++;
        }

        // Initialize stats if missing
        if (!diary.stats || typeof diary.stats !== 'object') {
          updates.stats = {
            total_days: 0,
            total_entries: 0,
            total_photos: 0,
            avg_temp: null,
            avg_humidity: null,
            total_water_ml: 0,
            issues_count: 0
          };
          needsUpdate = true;
          entityAudit.growDiaries.issues++;
        }

        // Initialize AI insights if missing
        if (!diary.ai_insights) {
          updates.ai_insights = {
            health_score: 100,
            last_analysis: null,
            last_analysis_summary: '',
            current_issues: [],
            recommendations: []
          };
          needsUpdate = true;
        }

        // Initialize share settings
        if (!diary.share_settings) {
          updates.share_settings = {
            is_public: false,
            allow_comments: true,
            auto_post_updates: false,
            post_visibility: 'public'
          };
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.GrowDiary.update(diary.id, updates);
            entityAudit.growDiaries.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'growDiaries',
              severity: 'medium',
              message: `Failed to fix diary ${diary.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Grow Diaries: ${entityAudit.growDiaries.checked} checked, ${entityAudit.growDiaries.issues} issues, ${entityAudit.growDiaries.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'growDiaries',
        message: `Failed to audit grow diaries: ${error.message}`
      });
    }

    // === GROW DIARY ENTRIES AUDIT ===
    try {
      const allEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({}, '-entry_date', 10000);
      entityAudit.growDiaryEntries.checked = allEntries.length;

      for (const entry of allEntries) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!entry.diary_id) {
          auditResults.critical_issues.push({
            category: 'growDiaryEntries',
            message: `Entry ${entry.id} has no diary_id - orphaned entry`
          });
          entityAudit.growDiaryEntries.issues++;
          continue;
        }

        if (typeof entry.day_number !== 'number') {
          updates.day_number = 1;
          needsUpdate = true;
          entityAudit.growDiaryEntries.issues++;
        }

        // Validate growth_stage
        const validStages = ['Keimung', 'Sämling', 'Wachstum', 'Blüte', 'Spülung', 'Ernte'];
        if (!validStages.includes(entry.growth_stage)) {
          updates.growth_stage = 'Wachstum';
          needsUpdate = true;
          entityAudit.growDiaryEntries.issues++;
        }

        // Validate arrays
        if (!Array.isArray(entry.media_urls)) {
          updates.media_urls = [];
          needsUpdate = true;
        }

        if (!Array.isArray(entry.actions_taken)) {
          updates.actions_taken = [];
          needsUpdate = true;
        }

        // Initialize environment_data if missing
        if (!entry.environment_data) {
          updates.environment_data = {};
          needsUpdate = true;
        }

        // Initialize feeding_data if missing
        if (!entry.feeding_data) {
          updates.feeding_data = {};
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.GrowDiaryEntry.update(entry.id, updates);
            entityAudit.growDiaryEntries.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'growDiaryEntries',
              severity: 'medium',
              message: `Failed to fix entry ${entry.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Grow Diary Entries: ${entityAudit.growDiaryEntries.checked} checked, ${entityAudit.growDiaryEntries.issues} issues, ${entityAudit.growDiaryEntries.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'growDiaryEntries',
        message: `Failed to audit grow diary entries: ${error.message}`
      });
    }

    // === CONVERSATIONS AUDIT ===
    try {
      const allConversations = await base44.asServiceRole.entities.Conversation.filter({}, '-last_message_timestamp', 2000);
      entityAudit.conversations.checked = allConversations.length;

      for (const conv of allConversations) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!Array.isArray(conv.participant_emails) || conv.participant_emails.length === 0) {
          auditResults.warnings.push({
            category: 'conversations',
            severity: 'high',
            message: `Conversation ${conv.id} has no participants`
          });
          entityAudit.conversations.issues++;
          continue;
        }

        // Validate arrays
        if (!Array.isArray(conv.admin_emails)) {
          updates.admin_emails = [conv.participant_emails[0]];
          needsUpdate = true;
          entityAudit.conversations.issues++;
        }

        // Initialize unread_counts
        if (!conv.unread_counts || typeof conv.unread_counts !== 'object') {
          const unreadCounts = {};
          conv.participant_emails.forEach(email => {
            unreadCounts[email] = 0;
          });
          updates.unread_counts = unreadCounts;
          needsUpdate = true;
          entityAudit.conversations.issues++;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Conversation.update(conv.id, updates);
            entityAudit.conversations.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'conversations',
              severity: 'medium',
              message: `Failed to fix conversation ${conv.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Conversations: ${entityAudit.conversations.checked} checked, ${entityAudit.conversations.issues} issues, ${entityAudit.conversations.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'conversations',
        message: `Failed to audit conversations: ${error.message}`
      });
    }

    // === MESSAGES AUDIT ===
    try {
      const allMessages = await base44.asServiceRole.entities.Message.filter({}, '-created_date', 10000);
      entityAudit.messages.checked = allMessages.length;

      for (const message of allMessages) {
        let needsUpdate = false;
        let updates = {};

        // Check required fields
        if (!message.conversation_id) {
          auditResults.warnings.push({
            category: 'messages',
            severity: 'high',
            message: `Message ${message.id} has no conversation_id`
          });
          entityAudit.messages.issues++;
          continue;
        }

        if (!message.sender_email) {
          auditResults.warnings.push({
            category: 'messages',
            severity: 'high',
            message: `Message ${message.id} has no sender_email`
          });
          entityAudit.messages.issues++;
        }

        // Validate arrays
        if (!Array.isArray(message.media_urls)) {
          updates.media_urls = [];
          needsUpdate = true;
        }

        if (!Array.isArray(message.read_by)) {
          updates.read_by = [];
          needsUpdate = true;
        }

        // Initialize reactions
        if (!message.reactions || typeof message.reactions !== 'object') {
          updates.reactions = {};
          needsUpdate = true;
        }

        if (needsUpdate) {
          try {
            await base44.asServiceRole.entities.Message.update(message.id, updates);
            entityAudit.messages.fixed++;
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'messages',
              severity: 'low',
              message: `Failed to fix message ${message.id}: ${updateError.message}`
            });
          }
        }
      }

      console.log(`✅ Messages: ${entityAudit.messages.checked} checked, ${entityAudit.messages.issues} issues, ${entityAudit.messages.fixed} fixed`);

    } catch (error) {
      auditResults.critical_issues.push({
        category: 'messages',
        message: `Failed to audit messages: ${error.message}`
      });
    }

    auditResults.detailed_reports.entities = entityAudit;

    // ========================================
    // 2️⃣ DATA RELATIONSHIPS & INTEGRITY
    // ========================================
    console.log('\n🔗 AUDITING DATA RELATIONSHIPS...');
    
    const relationshipAudit = {
      orphaned_comments: 0,
      orphaned_entries: 0,
      invalid_followers: 0,
      invalid_follows: 0,
      circular_follows: 0
    };

    // Check orphaned comments
    try {
      const allComments = await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 10000);
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 5000);
      const postIds = new Set(allPosts.map(p => p.id));

      for (const comment of allComments) {
        if (comment.post_id && !postIds.has(comment.post_id)) {
          relationshipAudit.orphaned_comments++;
          auditResults.warnings.push({
            category: 'relationships',
            severity: 'medium',
            message: `Comment ${comment.id} references non-existent post ${comment.post_id}`
          });
        }
      }

      console.log(`✅ Orphaned comments: ${relationshipAudit.orphaned_comments}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'relationships',
        severity: 'low',
        message: `Failed to check orphaned comments: ${error.message}`
      });
    }

    // Check orphaned entries
    try {
      const allEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({}, '-entry_date', 10000);
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({}, '-start_date', 2000);
      const diaryIds = new Set(allDiaries.map(d => d.id));

      for (const entry of allEntries) {
        if (entry.diary_id && !diaryIds.has(entry.diary_id)) {
          relationshipAudit.orphaned_entries++;
          auditResults.warnings.push({
            category: 'relationships',
            severity: 'high',
            message: `Entry ${entry.id} references non-existent diary ${entry.diary_id}`
          });
        }
      }

      console.log(`✅ Orphaned entries: ${relationshipAudit.orphaned_entries}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'relationships',
        severity: 'low',
        message: `Failed to check orphaned entries: ${error.message}`
      });
    }

    // Check follow relationships
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 5000);
      const userEmails = new Set(allUsers.map(u => u.email));

      for (const userRecord of allUsers) {
        // Check followers
        if (Array.isArray(userRecord.followers)) {
          const invalidFollowers = userRecord.followers.filter(email => !userEmails.has(email));
          if (invalidFollowers.length > 0) {
            relationshipAudit.invalid_followers += invalidFollowers.length;
            
            try {
              await base44.asServiceRole.entities.User.update(userRecord.id, {
                followers: userRecord.followers.filter(email => userEmails.has(email)),
                followers_count: userRecord.followers.filter(email => userEmails.has(email)).length
              });
            } catch (updateError) {
              auditResults.warnings.push({
                category: 'relationships',
                severity: 'low',
                message: `Failed to clean followers for user ${userRecord.id}`
              });
            }
          }
        }

        // Check following
        if (Array.isArray(userRecord.following)) {
          const invalidFollowing = userRecord.following.filter(email => !userEmails.has(email));
          if (invalidFollowing.length > 0) {
            relationshipAudit.invalid_follows += invalidFollowing.length;
            
            try {
              await base44.asServiceRole.entities.User.update(userRecord.id, {
                following: userRecord.following.filter(email => userEmails.has(email)),
                following_count: userRecord.following.filter(email => userEmails.has(email)).length
              });
            } catch (updateError) {
              auditResults.warnings.push({
                category: 'relationships',
                severity: 'low',
                message: `Failed to clean following for user ${userRecord.id}`
              });
            }
          }
        }

        // Check for circular follows (user following themselves)
        if (userRecord.following?.includes(userRecord.email)) {
          relationshipAudit.circular_follows++;
          
          try {
            await base44.asServiceRole.entities.User.update(userRecord.id, {
              following: userRecord.following.filter(email => email !== userRecord.email),
              following_count: userRecord.following.filter(email => email !== userRecord.email).length
            });
          } catch (updateError) {
            auditResults.warnings.push({
              category: 'relationships',
              severity: 'low',
              message: `Failed to fix circular follow for user ${userRecord.id}`
            });
          }
        }
      }

      console.log(`✅ Invalid followers: ${relationshipAudit.invalid_followers}`);
      console.log(`✅ Invalid follows: ${relationshipAudit.invalid_follows}`);
      console.log(`✅ Circular follows: ${relationshipAudit.circular_follows}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'relationships',
        severity: 'low',
        message: `Failed to check follow relationships: ${error.message}`
      });
    }

    auditResults.detailed_reports.relationships = relationshipAudit;

    // ========================================
    // 3️⃣ PERFORMANCE ANALYSIS
    // ========================================
    console.log('\n⚡ ANALYZING PERFORMANCE...');
    
    const performanceAudit = {
      large_posts: 0,
      large_comments: 0,
      excessive_media: 0,
      slow_queries_detected: []
    };

    try {
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 1000);

      for (const post of allPosts) {
        // Check post size
        if (post.content && post.content.length > 10000) {
          performanceAudit.large_posts++;
          auditResults.recommendations.push({
            category: 'performance',
            priority: 'low',
            message: `Post ${post.id} has very long content (${post.content.length} chars) - consider pagination`
          });
        }

        // Check excessive media
        if (post.media_urls && post.media_urls.length > 10) {
          performanceAudit.excessive_media++;
          auditResults.recommendations.push({
            category: 'performance',
            priority: 'medium',
            message: `Post ${post.id} has ${post.media_urls.length} media items - consider limiting to 10`
          });
        }
      }

      console.log(`✅ Large posts: ${performanceAudit.large_posts}`);
      console.log(`✅ Excessive media: ${performanceAudit.excessive_media}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'performance',
        severity: 'low',
        message: `Failed to analyze performance: ${error.message}`
      });
    }

    auditResults.detailed_reports.performance = performanceAudit;

    // ========================================
    // 4️⃣ SECURITY & PRIVACY CHECKS
    // ========================================
    console.log('\n🔒 CHECKING SECURITY & PRIVACY...');
    
    const securityAudit = {
      public_private_data_leaks: 0,
      missing_visibility_settings: 0,
      exposed_email_addresses: 0
    };

    try {
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 2000);

      for (const post of allPosts) {
        // Check for missing visibility
        if (!post.visibility) {
          securityAudit.missing_visibility_settings++;
          
          try {
            await base44.asServiceRole.entities.Post.update(post.id, {
              visibility: 'public'
            });
          } catch (updateError) {
            // Silent fail
          }
        }

        // Check for exposed email in content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        if (post.content && emailRegex.test(post.content)) {
          securityAudit.exposed_email_addresses++;
          auditResults.recommendations.push({
            category: 'security',
            priority: 'low',
            message: `Post ${post.id} contains email address in content - consider masking`
          });
        }
      }

      console.log(`✅ Missing visibility: ${securityAudit.missing_visibility_settings}`);
      console.log(`✅ Exposed emails: ${securityAudit.exposed_email_addresses}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'security',
        severity: 'low',
        message: `Failed to check security: ${error.message}`
      });
    }

    auditResults.detailed_reports.security = securityAudit;

    // ========================================
    // 5️⃣ USER EXPERIENCE ANALYSIS
    // ========================================
    console.log('\n✨ ANALYZING USER EXPERIENCE...');
    
    const uxAudit = {
      users_without_avatar: 0,
      users_without_bio: 0,
      empty_posts: 0,
      diaries_without_entries: 0
    };

    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 2000);

      for (const userRecord of allUsers) {
        if (!userRecord.avatar_url) {
          uxAudit.users_without_avatar++;
        }

        if (!userRecord.bio || userRecord.bio.trim() === '') {
          uxAudit.users_without_bio++;
        }
      }

      // Check empty posts
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 2000);
      for (const post of allPosts) {
        if ((!post.content || post.content.trim() === '') && 
            (!post.media_urls || post.media_urls.length === 0)) {
          uxAudit.empty_posts++;
        }
      }

      // Check diaries without entries
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({}, '-start_date', 1000);
      const allEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({}, '-entry_date', 10000);
      const diariesWithEntries = new Set(allEntries.map(e => e.diary_id));

      for (const diary of allDiaries) {
        if (!diariesWithEntries.has(diary.id)) {
          uxAudit.diaries_without_entries++;
        }
      }

      console.log(`✅ Users without avatar: ${uxAudit.users_without_avatar}`);
      console.log(`✅ Users without bio: ${uxAudit.users_without_bio}`);
      console.log(`✅ Empty posts: ${uxAudit.empty_posts}`);
      console.log(`✅ Diaries without entries: ${uxAudit.diaries_without_entries}`);

    } catch (error) {
      auditResults.warnings.push({
        category: 'ux',
        severity: 'low',
        message: `Failed to analyze UX: ${error.message}`
      });
    }

    auditResults.detailed_reports.ux = uxAudit;

    // ========================================
    // 6️⃣ STATISTICS SUMMARY
    // ========================================
    console.log('\n📈 GENERATING STATISTICS...');
    
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({}, '-created_date', 5000);
      const allPosts = await base44.asServiceRole.entities.Post.filter({}, '-created_date', 5000);
      const allComments = await base44.asServiceRole.entities.Comment.filter({}, '-created_date', 10000);
      const allDiaries = await base44.asServiceRole.entities.GrowDiary.filter({}, '-start_date', 2000);
      const allEntries = await base44.asServiceRole.entities.GrowDiaryEntry.filter({}, '-entry_date', 10000);

      auditResults.statistics = {
        total_users: allUsers.length,
        total_posts: allPosts.length,
        total_comments: allComments.length,
        total_diaries: allDiaries.length,
        total_diary_entries: allEntries.length,
        active_diaries: allDiaries.filter(d => d.status === 'active').length,
        public_posts: allPosts.filter(p => p.visibility === 'public').length,
        users_with_posts: new Set(allPosts.map(p => p.created_by)).size,
        users_with_diaries: new Set(allDiaries.map(d => d.created_by)).size,
        avg_posts_per_user: (allPosts.length / allUsers.length).toFixed(2),
        avg_comments_per_post: (allComments.length / allPosts.length).toFixed(2),
        avg_entries_per_diary: (allEntries.length / allDiaries.length).toFixed(2)
      };

    } catch (error) {
      auditResults.warnings.push({
        category: 'statistics',
        severity: 'low',
        message: `Failed to generate statistics: ${error.message}`
      });
    }

    // ========================================
    // 7️⃣ CALCULATE OVERALL SCORE
    // ========================================
    console.log('\n🎯 CALCULATING OVERALL SCORE...');
    
    let score = 1000; // Start with perfect score

    // Deduct points for critical issues
    score -= auditResults.critical_issues.length * 50;
    
    // Deduct points for warnings
    score -= auditResults.warnings.length * 10;
    
    // Deduct points for entity issues
    score -= entityAudit.posts.issues * 2;
    score -= entityAudit.users.issues * 5;
    score -= entityAudit.comments.issues * 1;
    score -= entityAudit.growDiaries.issues * 3;
    score -= entityAudit.growDiaryEntries.issues * 2;
    
    // Deduct points for relationship issues
    score -= relationshipAudit.orphaned_comments * 5;
    score -= relationshipAudit.orphaned_entries * 10;
    score -= relationshipAudit.invalid_followers * 2;
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    auditResults.score = score;
    auditResults.overall_status = score >= 900 ? 'excellent' : 
                                   score >= 700 ? 'good' : 
                                   score >= 500 ? 'fair' : 
                                   'needs_attention';

    // ========================================
    // 8️⃣ GENERATE RECOMMENDATIONS
    // ========================================
    console.log('\n💡 GENERATING RECOMMENDATIONS...');
    
    // High priority recommendations
    if (auditResults.critical_issues.length > 0) {
      auditResults.recommendations.push({
        category: 'critical',
        priority: 'high',
        message: `${auditResults.critical_issues.length} critical issues found - immediate attention required`
      });
    }

    if (entityAudit.posts.issues > 50) {
      auditResults.recommendations.push({
        category: 'data_quality',
        priority: 'high',
        message: 'High number of post issues detected - consider running data cleanup script'
      });
    }

    if (relationshipAudit.orphaned_comments > 10) {
      auditResults.recommendations.push({
        category: 'data_integrity',
        priority: 'medium',
        message: `${relationshipAudit.orphaned_comments} orphaned comments found - consider cleanup`
      });
    }

    if (uxAudit.users_without_avatar / auditResults.statistics.total_users > 0.5) {
      auditResults.recommendations.push({
        category: 'ux',
        priority: 'low',
        message: 'Over 50% of users have no avatar - consider prompting users to add one'
      });
    }

    if (uxAudit.diaries_without_entries > 0) {
      auditResults.recommendations.push({
        category: 'ux',
        priority: 'low',
        message: `${uxAudit.diaries_without_entries} diaries have no entries - consider onboarding flow`
      });
    }

    // ========================================
    // FINAL REPORT
    // ========================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 AUDIT COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Overall Score: ${score}/1000 (${auditResults.overall_status.toUpperCase()})`);
    console.log(`Critical Issues: ${auditResults.critical_issues.length}`);
    console.log(`Warnings: ${auditResults.warnings.length}`);
    console.log(`Recommendations: ${auditResults.recommendations.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return Response.json({
      success: true,
      audit: auditResults
    });

  } catch (error) {
    console.error('❌ AUDIT FAILED:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}, {
  requireAuth: true,
  requireRoles: ['admin', 'moderator'],
  rateLimit: RATE_LIMITS.search,
  maxBodySizeKB: 64
}));