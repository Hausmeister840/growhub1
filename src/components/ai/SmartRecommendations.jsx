
import EnhancedSmartRecommendations from './EnhancedSmartRecommendations';

export default function SmartRecommendations({ currentUser, userPosts, onOpenAI }) {
  // SAFETY: Filter userPosts to remove null entries and ensure they are valid objects with an 'id' before processing.
  // This addresses null-safety and potential cold start/new user scenarios where userPosts might be empty or contain invalid data.
  const validUserPosts = (userPosts || []).filter(p => p && typeof p === 'object' && p.id);
  
  return <EnhancedSmartRecommendations 
    currentUser={currentUser} 
    userPosts={validUserPosts} 
    onOpenAI={onOpenAI} 
  />;
}
