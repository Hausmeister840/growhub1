# GrowHub - Complete Technical Blueprint 2026

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema (Entities)](#database-schema-entities)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Functions](#backend-functions)
5. [API Integrations](#api-integrations)
6. [Authentication & Security](#authentication--security)
7. [Data Flow](#data-flow)
8. [Performance Optimizations](#performance-optimizations)

---

## System Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Base44 (Supabase-based BaaS) + Deno Deploy Functions
- **Database**: PostgreSQL (via Base44)
- **Real-time**: WebSocket subscriptions
- **State Management**: TanStack React Query + Zustand stores
- **UI Framework**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Core Services
1. **Base44 SDK** - All entity operations, auth, integrations
2. **Backend Functions** - Custom business logic, AI, webhooks
3. **Real-time Subscriptions** - Entity change events
4. **OAuth Connectors** - Google, Stripe, etc.

---

## Database Schema (Entities)

### Core Entities

#### 1. User (Built-in)
```
- id: UUID (auto)
- email: string (unique)
- full_name: string
- role: 'admin' | 'user'
- avatar_url: string (nullable)
- username: string (custom)
- verified: boolean
- following: array of emails
- followers: array of emails
- reputation_score: number
- created_date: timestamp
- updated_date: timestamp
```

#### 2. Post
```
- id: UUID
- content: string (max 5000 chars)
- created_by: email
- media_urls: array of strings
- type: 'text' | 'image' | 'video'
- post_type: 'general' | 'question' | 'tutorial' | 'review' | 'video' | 'grow_diary_update'
- tags: array of strings (max 10)
- visibility: 'public' | 'friends' | 'private'
- category: 'general' | 'grow_diary' | 'strain_review' | 'education' | 'product' | 'event' | 'video'
- status: 'draft' | 'published' | 'removed'
- moderation_status: 'pending' | 'allow' | 'warn' | 'age_restrict' | 'block'
- reactions: { like: { count, users: [] }, fire: {...}, laugh: {...}, mind_blown: {...}, helpful: {...}, celebrate: {...} }
- comments_count: number
- bookmarked_by_users: array of emails
- view_count: number
- share_count: number
- engagement_score: number (calculated)
- viral_score: number (24h trending)
- grow_diary_id: string (nullable, reference)
- premium_content: boolean
- is_nft: boolean
- created_date: timestamp
- updated_date: timestamp
- RLS: Read all, Delete only by creator
```

#### 3. Comment
```
- id: UUID
- content: string
- post_id: UUID (reference)
- author_email: email
- parent_comment_id: UUID (nullable, for replies)
- reactions: { total: number, byType: { emoji: { count, users: [] } } }
- created_date: timestamp
- updated_date: timestamp
- RLS: Create/Update/Delete only by author
```

#### 4. GrowDiary
```
- id: UUID
- created_by: email
- name: string (e.g., 'White Widow Indoor 2024')
- strain_name: string
- strain_id: string (reference)
- start_date: date
- expected_harvest_date: date
- current_stage: 'Keimung' | 'Sämling' | 'Wachstum' | 'Blüte' | 'Spülung' | 'Ernte'
- status: 'active' | 'completed' | 'archived' | 'problem'
- setup_type: 'indoor' | 'outdoor' | 'greenhouse'
- grow_method: 'soil' | 'hydro' | 'coco' | 'aero'
- cover_image_url: string
- plant_count: number
- goals: array of strings
- stats: { total_days, total_entries, total_photos, avg_temp, avg_humidity, total_water_ml, issues_count }
- ai_insights: { health_score (0-100), last_analysis, current_issues: [], recommendations: [], predicted_harvest_date }
- notifications_enabled: boolean
- share_settings: { is_public, allow_comments, auto_post_updates, post_visibility }
- created_date: timestamp
- updated_date: timestamp
- RLS: Read creator + public, Write creator only
```

#### 5. GrowLog
```
- id: UUID
- created_by: email
- grow_entry_id: UUID (reference)
- log_date: date
- notes: string
- photo_url: string
- status: string (e.g., 'Healthy', 'Deficiency')
- ph_level: number
- temperature: number
- humidity: number
- fertilizer: string
- light_cycle: string
- created_date: timestamp
- RLS: Creator only
```

#### 6. Product
```
- id: UUID
- created_by: email
- title: string
- description: string
- price: number
- category: 'seeds' | 'equipment' | 'accessories' | 'merchandise' | 'nutrients' | 'books' | 'other'
- condition: 'new' | 'like_new' | 'good' | 'fair'
- image_urls: array
- location: string
- seller_email: email
- is_trade: boolean
- status: 'available' | 'reserved' | 'sold'
- favorited_by_users: array of emails
- created_date: timestamp
- updated_date: timestamp
- RLS: Read all, Update/Delete by seller
```

#### 7. Strain
```
- id: UUID
- name: string (unique)
- alias: array
- genetics: string
- indicaPercent, sativaPercent: number
- thc: { min, max }
- effects: { effect_name: strength (0-1) }
- medical_use: { use_name: boolean }
- flavor, aroma: array
- growing: { difficulty, flowering_time_days, yield, smell_control, mold_resistance, training_methods }
- appearance: { trichome_coverage, color, bud_structure }
- rating: { wirkung, geschmack, anbau, medizinisch, preis_leistung, gesamt }
- suitable_for_beginners: boolean
- RLS: Read all, Write admin only
```

#### 8. Message
```
- id: UUID
- conversationId: UUID (reference)
- senderId: email
- senderName: string
- type: 'text' | 'image' | 'video' | 'voice' | 'gif' | 'sticker' | 'system'
- content: string
- media: { url, thumbnailUrl, width, height, duration, size }
- replyTo: { id, content, senderName }
- status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
- readBy: array of emails
- reactions: { emoji: array of user emails }
- isPinned: boolean
- isEdited: boolean
- isDeleted: boolean
- created_date: timestamp
- RLS: Visible to conversation participants
```

#### 9. Conversation
```
- id: UUID
- type: 'direct' | 'group' | 'grow_group'
- name: string (for groups)
- participants: array of emails
- admins: array of emails (for groups)
- lastMessage: { id, content, senderId, timestamp, type }
- unreadCount: { [userId]: number }
- isPinned: { [userId]: boolean }
- isMuted: { [userId]: boolean }
- isArchived: { [userId]: boolean }
- settings: { canEveryonePost, slowMode, mediaAllowed }
- created_date: timestamp
- RLS: Read only for participants
```

#### 10. Story
```
- id: UUID
- created_by: email
- media_url: string
- media_type: 'image' | 'video'
- text_overlay: string
- duration_seconds: number
- views: array of emails
- expires_at: timestamp (24h)
- replies: array of { user_email, message, timestamp }
- created_date: timestamp
```

#### 11. Notification
```
- id: UUID
- recipient_email: email
- sender_email: email
- sender_id: UUID
- type: 'reaction' | 'comment' | 'follow' | 'like' | 'message'
- post_id: UUID (nullable)
- conversation_id: UUID (nullable)
- read: boolean
- message: string
- created_date: timestamp
- RLS: Read only by recipient
```

#### 12. Follow
```
- id: UUID
- follower_id: UUID
- follower_email: email
- followee_id: UUID
- followee_email: email
- status: 'active' | 'blocked'
- weight: number (affinity score)
- last_interaction_at: timestamp
- RLS: Both follower and followee can see/manage
```

#### 13. Report
```
- id: UUID
- post_id: UUID
- reported_by: email
- reason: 'spam' | 'harassment' | 'inappropriate' | 'violence' | 'hate' | 'misinformation' | 'other'
- details: string
- status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
- reviewed_by: email (admin)
- reviewed_at: timestamp
- action_taken: string
- created_date: timestamp
```

#### 14. Club
```
- id: UUID
- name: string
- description: string
- address: string
- latitude, longitude: number
- city: string
- club_type: 'cannabis_social_club' | 'dispensary' | 'head_shop' | 'grow_shop' | 'doctor' | 'apotheke'
- website: string
- opening_hours: { monday-sunday: string }
- verified: boolean
- rating: number
- image_url: string
- features: array of strings
- favorited_by_users: array of emails
- created_date: timestamp
- RLS: Read all, Write admin only
```

#### 15. NoGoZone
```
- id: UUID
- name: string
- type: 'school' | 'kindergarten' | 'playground' | 'sports' | 'youth_centre' | 'pedestrian_area'
- latitude, longitude: number
- radius_meters: number
- source: string
- osm_id: string
- confidence: number (0-1)
- active_rule: { time_window: '07-20' | 'always', days: [0-6] }
- RLS: Read all, Write admin only
```

#### 16. PlantScan
```
- id: UUID
- created_by: email
- image_url: string
- health_score: number (0-10)
- analysis_result: object
- grow_diary_id: string (nullable)
- notes: string
- created_date: timestamp
- RLS: Creator only
```

#### 17. LiveStream
```
- id: UUID
- created_by: email
- title: string
- description: string
- stream_url: string
- thumbnail_url: string
- status: 'live' | 'ended' | 'scheduled'
- started_at, ended_at: timestamp
- viewer_count: number
- current_viewers: array of emails
- category: 'growing' | 'harvest' | 'tutorial' | 'q&a' | 'chill'
- created_date: timestamp
```

#### 18. Group
```
- id: UUID
- created_by: email
- name: string
- description: string
- cover_image_url: string
- privacy: 'public' | 'private'
- members: array of emails
- admin_emails: array of emails
- created_date: timestamp
- RLS: Read public or if member, Write by admin
```

#### 19. Challenge
```
- id: UUID
- title: string
- description: string
- type: 'daily' | 'weekly' | 'monthly'
- difficulty: 'easy' | 'medium' | 'hard'
- reward_points: number
- participants: array of { email, completed_date, score }
- status: 'active' | 'completed' | 'archived'
- created_date: timestamp
```

#### 20. Streak
```
- id: UUID
- user_email: email
- streak_type: 'posts' | 'logins' | 'comments'
- count: number
- last_activity: timestamp
- created_date: timestamp
```

---

## Frontend Architecture

### Pages (in pages/ folder)
```
Feed.jsx - Main feed with posts, filtering, search
Profile.jsx - User profile with posts, grows, activity
Messages.jsx - Direct messaging + conversations
Reels.jsx - Video feed (TikTok-style)
Marketplace.jsx - Buy/sell products
GrowDiaries.jsx - View all grow diaries
Map.jsx - Cannabis locations, clubs, no-go zones
Strains.jsx - Cannabis strain database
Settings.jsx - User preferences
AdminDashboard.jsx - Admin panel
Notifications.jsx - Notification center
PostThread.jsx - Single post detail view
etc...
```

### Components Architecture

#### Feed Components
- `FuturisticPostCard.jsx` - Post display with actions (like, comment, share)
- `ImmersiveMediaViewer.jsx` - Full-screen image/video viewer
- `CreatePost.jsx` - Post creation modal
- `CommentsModal.jsx` - Comments display + input
- `CommentItem.jsx` - Individual comment
- `CommentInput.jsx` - Comment input field

#### Layout Components
- `Layout.js` - Main wrapper for all pages
- `DesktopNav.jsx` - Left sidebar navigation
- `MobileBottomNav.jsx` - Mobile bottom navigation
- `MobileHeader.jsx` - Mobile top header
- `MobileMenu.jsx` - Mobile menu overlay

#### Grow Components
- `GrowEntryModal.jsx` - Add grow log entry
- `GrowCharts.jsx` - Charts for grow stats
- `GrowAIChat.jsx` - AI grow coach
- `GrowReminders.jsx` - Reminders for tasks

#### UI Base Components (in components/ui/)
- `button.jsx` - Button component
- `input.jsx` - Input component
- `textarea.jsx` - Textarea component
- `card.jsx` - Card container
- `badge.jsx` - Badge/tag component
- `select.jsx` - Select dropdown
- `tabs.jsx` - Tab navigation
- `dialog.jsx` - Modal dialog
- And 30+ more...

#### Hooks (custom)
- `usePost()` - Post operations
- `useFeed()` - Feed data + filtering
- `usePresence()` - User online status
- `useOfflineQueue()` - Offline sync
- `useAnimationFrame()` - Performance
- `useInfiniteScroll()` - Pagination
- `useVirtualScroll()` - Large lists

#### Stores (Zustand)
- `useUserStore.js` - Current user state
- `useUIStore.js` - UI state (modals, etc.)

### Data Flow

```
User Action → Component Event Handler
↓
API Call via base44.entities.EntityName.operation()
↓
Base44 SDK → Backend (Supabase)
↓
Response returned
↓
State updated (React Query / Zustand)
↓
Component re-renders
↓
UI updates

Real-time Flow:
base44.entities.Post.subscribe(callback)
↓
Database change detected
↓
WebSocket event sent
↓
Callback fired
↓
Local state updated
↓
UI updates immediately
```

---

## Backend Functions

### Function Structure
All functions in `functions/` folder, use Deno Deploy.

```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Your logic here
    
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### Key Functions

#### Content Management
- `createPost()` - Create new post
- `updatePost()` - Edit post
- `deletePost()` - Remove post
- `createComment()` - Add comment
- `createStory()` - Create story

#### User Management
- `followUser()` / `unfollowUser()` - Follow/unfollow
- `getProfile()` - Fetch user profile
- `updateProfile()` - Update user info
- `uploadAvatar()` - Profile picture

#### Grow Management
- `analyzeImage()` - AI plant health analysis
- `generateGrowTips()` - AI recommendations
- `exportGrowDiaryPDF()` - PDF export

#### Moderation
- `autoModeratePost()` - Content moderation (spam, inappropriate)
- `evaluateContent()` - AI content review
- `moderatePost()` - Admin action

#### Feed & Recommendations
- `getPersonalizedFeed()` - AI-powered feed
- `getTrendingFeed()` - Trending posts
- `getSmartFeed()` - Hybrid algorithm
- `calculateFeedScores()` - Engagement scoring

#### Admin
- `getAnalyticsDashboard()` - Stats + charts
- `auditCompleteApp()` - Security audit

#### Real-time
- Auto-increment comment count on Post
- Update viral_score every 24h
- Update user.updated_date on any change

---

## API Integrations

### Core Integration (always available)
```typescript
base44.integrations.Core.InvokeLLM({
  prompt: string,
  add_context_from_internet: boolean,
  response_json_schema: object,
  file_urls: array
})

base44.integrations.Core.SendEmail({
  to: string,
  subject: string,
  body: string,
  from_name: string
})

base44.integrations.Core.UploadFile({
  file: Blob
})

base44.integrations.Core.GenerateImage({
  prompt: string,
  existing_image_urls: array
})

base44.integrations.Core.ExtractDataFromUploadedFile({
  file_url: string,
  json_schema: object
})
```

### OAuth Connectors (if authorized)
- Google Calendar
- Google Drive
- Google Sheets
- Slack
- Notion
- HubSpot
- LinkedIn

---

## Authentication & Security

### Auth Flow
1. User logs in → Base44 login page
2. Email + password authentication
3. JWT token returned
4. Token stored in secure session
5. All requests include token in headers
6. Token auto-refreshes on expiry

### Row-Level Security (RLS)
- Posts: Everyone reads, only creator deletes
- Comments: Authenticated users create, only author updates/deletes
- GrowDiary: Creator + followers read public, creator writes
- Messages: Only conversation participants see
- User profile: Limited fields visible to others

### Input Validation
```typescript
// All user inputs sanitized
validators.sanitizeText(input, maxLength)
validators.detectSpam(content) // Checks for spam patterns
validators.validateTags(tags, maxCount, maxLength)
validators.validateEmail(email)
```

### Rate Limiting
```typescript
rateLimiter.canMakeRequest(userId, maxRequests, timeWindow)
// Example: 5 posts per minute
```

---

## Data Flow Examples

### Create Post Flow
```
User writes post → CreatePost modal
↓
Validate text (max 5000 chars, no spam)
↓
Upload media files (images/videos)
↓
Get signed URLs
↓
Call base44.entities.Post.create()
↓
Post saved to DB
↓
trigger 'routeChange' event
↓
Feed component reloads posts
↓
New post appears in feed
↓
Real-time subscription fires
↓
Other users see post immediately
```

### Add Comment Flow
```
User clicks comment button
↓
CommentsModal opens
↓
loadComments() fetches all comments
↓
User types comment
↓
Validate text
↓
Create optimistic comment (show immediately)
↓
Send to backend
↓
base44.entities.Comment.create()
↓
Update post.comments_count
↓
Success message
↓
If error, remove optimistic comment
```

### Like/Reaction Flow
```
User clicks heart icon
↓
Optimistic update: increment count
↓
Update local reactions array
↓
Send to backend
↓
base44.entities.Post.update({ reactions: {...} })
↓
If error, revert optimistic update
```

---

## Performance Optimizations

### Frontend Optimization
1. **Infinite Scroll** - Load 20 posts at a time
2. **Image Optimization** - Lazy loading, resizing
3. **Video Optimization** - HLS streaming, adaptive quality
4. **Code Splitting** - Route-based lazy loading
5. **Memoization** - useMemo, useCallback
6. **Virtual Scrolling** - Large lists
7. **Service Worker** - Offline support
8. **Compression** - gzip, brotli
9. **Caching** - TanStack Query, Browser cache
10. **Bundle Optimization** - Tree-shaking, minification

### Backend Optimization
1. **Database Indexes** - On frequently queried fields
2. **Query Optimization** - Limit returned fields
3. **Pagination** - Don't load everything at once
4. **Caching** - Redis (if available)
5. **Connection Pooling** - Reuse DB connections
6. **Async Processing** - Don't block requests
7. **Rate Limiting** - Prevent abuse
8. **CDN** - Serve media from CDN

### Database Optimization
1. **Indexes on**: user_email, created_date, post_id, visibility
2. **Partitioning**: Posts by created_date (for older queries)
3. **Archive old data**: Move 6+ month old posts to archive table
4. **Denormalization**: Store comment_count on Post (instead of COUNT query)

---

## File Structure
```
src/
├── pages/              # React components (one per file)
│   ├── Feed.jsx
│   ├── Profile.jsx
│   ├── Messages.jsx
│   └── ...
├── components/         # Reusable components
│   ├── feed/
│   │   ├── FuturisticPostCard.jsx
│   │   ├── CreatePost.jsx
│   │   └── ...
│   ├── ui/            # shadcn/ui base components
│   ├── layout/
│   ├── hooks/
│   ├── stores/
│   ├── utils/
│   └── services/
├── functions/         # Backend functions (Deno)
│   ├── createPost.js
│   ├── moderation/
│   ├── feed/
│   └── ...
├── entities/          # Data schemas (JSON)
│   ├── User.json
│   ├── Post.json
│   └── ...
├── Layout.js          # Main layout wrapper
├── globals.css        # Global styles
└── api/
    └── base44Client.js # Pre-initialized SDK
```

---

## Deployment

### Frontend
- Deployed on Base44 platform
- Automatic builds on git push
- Auto SSL, CDN, caching

### Backend Functions
- Deployed on Deno Deploy
- Automatic on file save
- Globally distributed

### Database
- Managed by Base44 (Supabase)
- Daily backups
- Automatic scaling

---

## Future Scalability

1. **Microservices** - Split functions by domain
2. **Message Queue** - Async processing (RabbitMQ, Redis)
3. **Search Engine** - Elasticsearch for full-text search
4. **Analytics** - BigQuery for data warehouse
5. **ML Pipeline** - Better recommendations
6. **Multi-region** - Global distribution
7. **GraphQL** - Alternative to REST
8. **WebRTC** - Video calls, streaming

---

## Monitoring & Debugging

### Frontend Monitoring
- Error boundaries catch React errors
- Error logging service
- Performance metrics (Core Web Vitals)
- Session replay (for errors)

### Backend Monitoring
- Function execution logs
- Error tracking
- Performance metrics
- Database query logs

### Tools
- Browser DevTools
- Sentry (error tracking)
- DataDog (monitoring)
- Postman (API testing)

---

Last Updated: 2026-01-17