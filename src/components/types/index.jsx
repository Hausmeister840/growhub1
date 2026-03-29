/**
 * 📝 GROWHUB - TYPE DEFINITIONS
 * Using JSDoc for type hints in JavaScript
 */

// This file exports type definitions via JSDoc comments
// IDEs will use these for autocomplete and type checking

// ==================== USER TYPES ====================

/**
 * @typedef {'admin' | 'user'} UserRole
 */

/**
 * @typedef {'beginner' | 'intermediate' | 'expert' | 'master'} GrowLevel
 */

/**
 * @typedef {'patient' | 'grower' | 'doctor' | 'club_admin' | 'shop_owner'} AccountType
 */

/**
 * @typedef {'public' | 'followers' | 'private'} PrivacyMode
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} full_name
 * @property {UserRole} role
 * @property {string} [username]
 * @property {string} [handle]
 * @property {string} [bio]
 * @property {string} [avatar_url]
 * @property {string} [banner_url]
 * @property {string} [cover_photo_url]
 * @property {string} [website_url]
 * @property {string[]} [interests]
 * @property {string} [location]
 * @property {GrowLevel} [grow_level]
 * @property {number} [coins]
 * @property {number} [xp]
 * @property {string[]} [badges]
 * @property {boolean} [verified]
 * @property {AccountType} [account_type]
 * @property {PrivacyMode} [privacy_mode]
 * @property {string[]} [followers]
 * @property {string[]} [following]
 * @property {number} [followers_count]
 * @property {number} [following_count]
 * @property {number} [posts_count]
 * @property {string[]} [blocked_users]
 * @property {boolean} [onboarded]
 * @property {string} [onboarding_completed_at]
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== POST TYPES ====================

/**
 * @typedef {'draft' | 'under_review' | 'published' | 'removed'} PostStatus
 */

/**
 * @typedef {'pending' | 'allow' | 'warn' | 'age_restrict' | 'block'} ModerationStatus
 */

/**
 * @typedef {'general' | 'question' | 'tutorial' | 'review' | 'video' | 'grow_diary_update'} PostType
 */

/**
 * @typedef {'video' | 'live' | 'image' | 'text'} MediaType
 */

/**
 * @typedef {'public' | 'friends' | 'private'} Visibility
 */

/**
 * @typedef {'general' | 'grow_diary' | 'strain_review' | 'education' | 'product' | 'event' | 'video'} PostCategory
 */

/**
 * @typedef {Object} ReactionData
 * @property {number} count
 * @property {string[]} users
 */

/**
 * @typedef {Object} Reactions
 * @property {ReactionData} [like]
 * @property {ReactionData} [fire]
 * @property {ReactionData} [laugh]
 * @property {ReactionData} [mind_blown]
 * @property {ReactionData} [helpful]
 * @property {ReactionData} [celebrate]
 */

/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} [content]
 * @property {PostStatus} status
 * @property {ModerationStatus} [moderation_status]
 * @property {string} [moderation_reason]
 * @property {string} [moderation_checked_at]
 * @property {boolean} [requires_manual_review]
 * @property {boolean} [sensitive]
 * @property {string} [content_warning]
 * @property {PostType} post_type
 * @property {MediaType} type
 * @property {string[]} [media_urls]
 * @property {string[]} [tags]
 * @property {Reactions} reactions
 * @property {number} comments_count
 * @property {Visibility} visibility
 * @property {PostCategory} category
 * @property {number} view_count
 * @property {number} share_count
 * @property {string[]} [bookmarked_by_users]
 * @property {string} [grow_diary_id]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== COMMENT TYPES ====================

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} content
 * @property {string} post_id
 * @property {string} author_email
 * @property {string} [parent_comment_id]
 * @property {Object} [reactions]
 * @property {number} [reactions.total]
 * @property {Record<string, number>} [reactions.byType]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== GROW DIARY TYPES ====================

/**
 * @typedef {'Keimung' | 'Sämling' | 'Wachstum' | 'Blüte' | 'Spülung' | 'Ernte'} GrowStage
 */

/**
 * @typedef {'active' | 'completed' | 'archived' | 'problem'} DiaryStatus
 */

/**
 * @typedef {'indoor' | 'outdoor' | 'greenhouse'} SetupType
 */

/**
 * @typedef {'soil' | 'hydro' | 'coco' | 'aero'} GrowMethod
 */

/**
 * @typedef {Object} DiaryStats
 * @property {number} [total_days]
 * @property {number} [total_entries]
 * @property {number} [total_photos]
 * @property {number} [avg_temp]
 * @property {number} [avg_humidity]
 * @property {number} [total_water_ml]
 * @property {number} [issues_count]
 */

/**
 * @typedef {Object} AIInsights
 * @property {number} [health_score]
 * @property {string} [last_analysis]
 * @property {string} [last_analysis_summary]
 * @property {string[]} [current_issues]
 * @property {string[]} [recommendations]
 * @property {string} [predicted_harvest_date]
 */

/**
 * @typedef {Object} ShareSettings
 * @property {boolean} [is_public]
 * @property {boolean} [allow_comments]
 * @property {boolean} [auto_post_updates]
 * @property {Visibility} [post_visibility]
 */

/**
 * @typedef {Object} GrowDiary
 * @property {string} id
 * @property {string} name
 * @property {string} strain_name
 * @property {string} [strain_id]
 * @property {string} start_date
 * @property {string} [expected_harvest_date]
 * @property {GrowStage} current_stage
 * @property {DiaryStatus} status
 * @property {SetupType} setup_type
 * @property {GrowMethod} grow_method
 * @property {string} [cover_image_url]
 * @property {number} plant_count
 * @property {string[]} [goals]
 * @property {DiaryStats} [stats]
 * @property {AIInsights} [ai_insights]
 * @property {boolean} [notifications_enabled]
 * @property {ShareSettings} [share_settings]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== GROW DIARY ENTRY TYPES ====================

/**
 * @typedef {'excellent' | 'good' | 'fair' | 'poor' | 'critical'} HealthAssessment
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} IssueSeverity
 */

/**
 * @typedef {'immediate' | 'urgent' | 'soon' | 'routine'} ActionPriority
 */

/**
 * @typedef {'germination' | 'first_leaves' | 'topped' | 'flowering_start' | 'harvest'} MilestoneType
 */

/**
 * @typedef {Object} EnvironmentData
 * @property {number} [temp_c]
 * @property {number} [humidity_rh]
 * @property {number} [vpd_kpa]
 * @property {number} [co2_ppm]
 * @property {number} [light_intensity_ppfd]
 * @property {string} [light_schedule]
 */

/**
 * @typedef {Object} FeedingData
 * @property {number} [water_ml]
 * @property {number} [ph]
 * @property {number} [ec_ppm]
 * @property {string} [nutrients]
 * @property {string} [nutrient_schedule]
 */

/**
 * @typedef {Object} DetectedIssue
 * @property {string} issue_type
 * @property {IssueSeverity} severity
 * @property {string} description
 * @property {string} recommendation
 */

/**
 * @typedef {Object} ActionItem
 * @property {string} action
 * @property {ActionPriority} priority
 * @property {string} timeframe
 */

/**
 * @typedef {Object} AIAnalysis
 * @property {string} [analyzed_at]
 * @property {HealthAssessment} [health_assessment]
 * @property {number} [confidence_score]
 * @property {DetectedIssue[]} [detected_issues]
 * @property {string[]} [positive_observations]
 * @property {ActionItem[]} [action_items]
 * @property {string[]} [knowledge_links]
 * @property {string} [detailed_analysis]
 */

/**
 * @typedef {Object} GrowDiaryEntry
 * @property {string} id
 * @property {string} diary_id
 * @property {number} day_number
 * @property {number} [week_number]
 * @property {string} entry_date
 * @property {GrowStage} growth_stage
 * @property {string} [plant_observation]
 * @property {number} [plant_height_cm]
 * @property {EnvironmentData} [environment_data]
 * @property {FeedingData} [feeding_data]
 * @property {string[]} [actions_taken]
 * @property {string[]} [media_urls]
 * @property {AIAnalysis} [ai_analysis]
 * @property {boolean} [milestone]
 * @property {MilestoneType} [milestone_type]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== NOGO ZONE TYPES ====================

/**
 * @typedef {'school' | 'kindergarten' | 'playground' | 'sports' | 'youth_centre' | 'pedestrian_area'} ZoneType
 */

/**
 * @typedef {'always' | '07-20'} TimeWindow
 */

/**
 * @typedef {Object} ActiveRule
 * @property {TimeWindow} time_window
 * @property {number[]} days
 */

/**
 * @typedef {Object} NoGoZone
 * @property {string} id
 * @property {string} name
 * @property {ZoneType} type
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} radius_meters
 * @property {string} [source]
 * @property {string} [osm_id]
 * @property {number} [confidence]
 * @property {ActiveRule} [active_rule]
 * @property {string} created_date
 * @property {string} updated_date
 */

/**
 * @typedef {Object} ZoneMatch
 * @property {string} name
 * @property {string} kind
 * @property {number} distance_m
 * @property {string} legal_basis
 */

/**
 * @typedef {Object} ZoneStatus
 * @property {'safe' | 'warning' | 'critical'} status
 * @property {'info' | 'warning' | 'critical'} severity
 * @property {boolean} in_zone
 * @property {string} warning_message
 * @property {ZoneMatch[]} [matches]
 * @property {ZoneMatch[]} [approaching]
 */

// ==================== CONVERSATION & MESSAGE TYPES ====================

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} [name]
 * @property {boolean} is_group
 * @property {string[]} participant_emails
 * @property {string[]} [admin_emails]
 * @property {string} [avatar_url]
 * @property {string} [last_message_preview]
 * @property {string} [last_message_timestamp]
 * @property {Record<string, number>} [unread_counts]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversation_id
 * @property {string} sender_email
 * @property {string} [content]
 * @property {string[]} [media_urls]
 * @property {Record<string, string[]>} [reactions]
 * @property {string[]} [read_by]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== PRODUCT/MARKETPLACE TYPES ====================

/**
 * @typedef {'seeds' | 'equipment' | 'accessories' | 'merchandise' | 'nutrients' | 'books' | 'other'} ProductCategory
 */

/**
 * @typedef {'new' | 'like_new' | 'good' | 'fair'} ProductCondition
 */

/**
 * @typedef {'available' | 'reserved' | 'sold'} ProductStatus
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {number} price
 * @property {ProductCategory} category
 * @property {ProductCondition} condition
 * @property {string[]} [image_urls]
 * @property {string} [location]
 * @property {string} seller_email
 * @property {boolean} [is_trade]
 * @property {ProductStatus} status
 * @property {string[]} [favorited_by_users]
 * @property {string} created_by
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== NOTIFICATION TYPES ====================

/**
 * @typedef {'reaction' | 'comment' | 'follow' | 'like' | 'message'} NotificationType
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} recipient_email
 * @property {string} sender_email
 * @property {string} sender_id
 * @property {NotificationType} type
 * @property {string} [post_id]
 * @property {string} [conversation_id]
 * @property {boolean} read
 * @property {string} message
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== CHALLENGE/GAMIFICATION TYPES ====================

/**
 * @typedef {'post' | 'comment' | 'social' | 'streak' | 'growth' | 'knowledge'} ChallengeType
 */

/**
 * @typedef {'easy' | 'medium' | 'hard' | 'expert'} DifficultyLevel
 */

/**
 * @typedef {'active' | 'completed' | 'expired' | 'paused'} ChallengeStatus
 */

/**
 * @typedef {Object} ChallengeRequirements
 * @property {string} [post_type]
 * @property {number} [min_reactions]
 * @property {string[]} [hashtags_required]
 * @property {number} [time_limit_hours]
 */

/**
 * @typedef {Object} Challenge
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {ChallengeType} challenge_type
 * @property {DifficultyLevel} difficulty_level
 * @property {string} target_user_email
 * @property {number} target_count
 * @property {number} current_progress
 * @property {number} xp_reward
 * @property {number} [coin_reward]
 * @property {ChallengeStatus} status
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {number} duration_days
 * @property {string} icon_emoji
 * @property {boolean} [ai_generated]
 * @property {string} [completion_date]
 * @property {ChallengeRequirements} [requirements]
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== STREAK TYPES ====================

/**
 * @typedef {'daily_visit' | 'post_creation' | 'engagement'} StreakType
 */

/**
 * @typedef {Object} Streak
 * @property {string} id
 * @property {string} user_email
 * @property {number} day_count
 * @property {string} [last_activity_date]
 * @property {number} longest_streak
 * @property {StreakType} streak_type
 * @property {string} [updated_at]
 * @property {string} created_date
 * @property {string} updated_date
 */

// ==================== API RESPONSE TYPES ====================

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} per_page
 * @property {boolean} has_more
 */

// ==================== UI STATE TYPES ====================

/**
 * @typedef {Object} ModalState
 * @property {boolean} createPost
 * @property {boolean} editPost
 * @property {boolean} comments
 * @property {boolean} imageViewer
 */

/**
 * @typedef {Object} ModalData
 * @property {*} [createPost]
 * @property {Post} [editPost]
 * @property {Post} [comments]
 * @property {*} [imageViewer]
 */

// ==================== FEED TYPES ====================

/**
 * @typedef {'for_you' | 'latest' | 'trending' | 'videos' | 'following'} FeedTab
 */

/**
 * @typedef {Object} FeedState
 * @property {Post[]} posts
 * @property {Record<string, User>} users
 * @property {boolean} isLoading
 * @property {boolean} isFetchingMore
 * @property {boolean} hasMore
 * @property {FeedTab} activeTab
 * @property {string} [error]
 */

// ==================== FORM TYPES ====================

/**
 * @typedef {Object} PostFormData
 * @property {string} content
 * @property {string[]} media_urls
 * @property {Visibility} visibility
 * @property {PostType} post_type
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} DiaryFormData
 * @property {string} name
 * @property {string} strain_name
 * @property {string} start_date
 * @property {SetupType} setup_type
 * @property {GrowMethod} grow_method
 * @property {number} plant_count
 * @property {string[]} [goals]
 */

// ==================== UTILITY TYPES ====================

/**
 * @template T
 * @typedef {T | null} Nullable
 */

/**
 * @template T
 * @typedef {T | undefined} Optional
 */

/**
 * @typedef {string} ID
 */

/**
 * @typedef {string} Timestamp
 */

/**
 * @typedef {string} Email
 */

/**
 * @typedef {string} URL
 */

// ==================== HOOK RETURN TYPES ====================

/**
 * @typedef {Object} UsePostReturn
 * @property {function(string, string): Promise<void>} handleReaction
 * @property {function(string): Promise<void>} handleBookmark
 * @property {function(string): Promise<void>} handleDelete
 * @property {function(string): void} handleCommentAdded
 */

/**
 * @typedef {Object} UseFeedReturn
 * @property {boolean} isLoading
 * @property {boolean} isFetchingMore
 * @property {boolean} hasMore
 * @property {boolean} networkError
 * @property {boolean} rateLimited
 * @property {function(): void} loadMorePosts
 */

// ==================== EVENT TYPES ====================

/**
 * @typedef {Object} PostEvent
 * @property {'reaction' | 'comment' | 'share' | 'bookmark'} type
 * @property {string} postId
 * @property {string} userId
 * @property {string} timestamp
 */

/**
 * @typedef {Object} GrowEvent
 * @property {'entry_created' | 'milestone_reached' | 'issue_detected' | 'harvest'} type
 * @property {string} diaryId
 * @property {string} [entryId]
 * @property {*} data
 * @property {string} timestamp
 */

// Export empty object (types are in JSDoc comments)
export default {};