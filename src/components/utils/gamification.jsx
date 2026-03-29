
import { User } from '@/entities/User';
import { Post } from '@/entities/Post';
import { Comment } from '@/entities/Comment';

export const xpValues = {
  POST_CREATED: 25,
  COMMENT_CREATED: 5,
  POST_LIKED: 2, // XP for the post author
  FOLLOWED: 10, // XP for the user who got followed
};

export const achievementsList = [
    { id: 'first_post', name: 'Wortmelder', description: 'Du hast deinen ersten Beitrag erstellt!', icon: 'MessageSquare', trigger: 'POST_CREATED', condition: async ({ user, posts }) => posts.length >= 1 },
    { id: '5_posts', name: 'Stammgast', description: 'Erstelle 5 Beiträge.', icon: 'MessagesSquare', trigger: 'POST_CREATED', condition: async ({ user, posts }) => posts.length >= 5 },
    { id: 'first_like_received', name: 'Anerkennung', description: 'Dein erster Beitrag hat ein Like erhalten!', icon: 'Heart', trigger: 'POST_LIKED', condition: async ({ user }) => true }, // condition is simple, triggered on first like
    { id: '10_likes_received', name: 'Publikumsliebling', description: 'Erhalte insgesamt 10 Likes auf deine Posts.', icon: 'ThumbsUp', trigger: 'POST_LIKED', condition: async ({ user, posts }) => {
        const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
        return totalLikes >= 10;
    }},
    { id: 'first_follower', name: 'Anführer', description: 'Du hast deinen ersten Follower gewonnen!', icon: 'UserPlus', trigger: 'FOLLOWED', condition: async ({ user }) => (user.followers?.length || 0) >= 1 },
    { id: '10_followers', name: 'Influencer', description: 'Erreiche 10 Follower.', icon: 'Users', trigger: 'FOLLOWED', condition: async ({ user }) => (user.followers?.length || 0) >= 10 },
    { id: 'first_comment', name: 'Diskussionsstarter', description: 'Schreibe deinen ersten Kommentar.', icon: 'MessageCircle', trigger: 'COMMENT_CREATED', condition: async ({ user, comments }) => comments.length >= 1 },
    { id: '5_comments', name: 'Gesprächsführer', description: 'Schreibe 5 Kommentare.', icon: 'MessageSquareText', trigger: 'COMMENT_CREATED', condition: async ({ user, comments }) => comments.length >= 5 },
    { id: '10_comments', name: 'Vielschreiber', description: 'Schreibe 10 Kommentare.', icon: 'MessagesSquareText', trigger: 'COMMENT_CREATED', condition: async ({ user, comments }) => comments.length >= 10 },
    { id: 'photographer', name: 'Fotograf', description: 'Poste einen Beitrag mit einem Bild.', icon: 'Camera', trigger: 'POST_CREATED', condition: async ({ user, posts }) => posts.some(p => p.media_urls && p.media_urls.length > 0)},
];

export const awardXPAndCheckAchievements = async (userId, actionType, entity) => {
    const users = await User.filter({ id: userId });
    if (!users || users.length === 0) return { newXp: 0, newAchievements: [] };
    const user = users[0];

    // 1. Award XP
    const xpGained = xpValues[actionType] || 0;
    const newXp = (user.xp || 0) + xpGained;
    
    // 2. Check for Achievements
    const userBadges = user.badges || [];
    const newAchievements = [];

    // Pre-fetch data for conditions to avoid multiple calls
    const posts = await Post.filter({ created_by: user.email });
    const comments = await Comment.filter({ author_email: user.email });

    for (const achievement of achievementsList) {
        if (!userBadges.includes(achievement.id) && achievement.trigger === actionType) {
             const conditionMet = await achievement.condition({ user, posts, comments, entity });
             if (conditionMet) {
                 newAchievements.push(achievement);
                 userBadges.push(achievement.id);
             }
        }
    }
    
    // 3. Update User Data in DB if there are changes
    if (xpGained > 0 || newAchievements.length > 0) {
        await User.update(userId, { xp: newXp, badges: userBadges });
    }
    
    return { newXp, newAchievements };
};
