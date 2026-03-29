/**
 * Checks if the current user is allowed to see a specific section
 * of the profile user based on their privacy settings.
 *
 * @param {string} visibility - 'public' | 'followers' | 'private'
 * @param {boolean} isOwnProfile - true if viewing own profile
 * @param {boolean} isFollowing - true if current user follows profile user
 * @returns {boolean}
 */
export function canViewSection(visibility, isOwnProfile, isFollowing) {
  if (isOwnProfile) return true;
  if (visibility === 'public') return true;
  if (visibility === 'followers' && isFollowing) return true;
  return false;
}

/**
 * Checks if current user can send a message to target user.
 * @param {string} allowFrom - 'everyone' | 'followers' | 'nobody'
 * @param {boolean} isFollowing - target user follows current user (i.e. current is in target's followers)
 * @returns {boolean}
 */
export function canSendMessage(allowFrom, isFollowing) {
  if (allowFrom === 'everyone') return true;
  if (allowFrom === 'followers' && isFollowing) return true;
  return false;
}