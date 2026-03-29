/**
 * 🛡️ TYPE GUARDS
 * Runtime type checking helpers
 */

/**
 * Check if object is a Post
 * @param {any} obj
 * @returns {boolean}
 */
export function isPost(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.created_by === 'string' &&
    typeof obj.status === 'string' &&
    ['draft', 'under_review', 'published', 'removed'].includes(obj.status)
  );
}

/**
 * Check if object is a User
 * @param {any} obj
 * @returns {boolean}
 */
export function isUser(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.full_name === 'string' &&
    ['admin', 'user'].includes(obj.role)
  );
}

/**
 * Check if object is a GrowDiary
 * @param {any} obj
 * @returns {boolean}
 */
export function isGrowDiary(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.strain_name === 'string' &&
    typeof obj.status === 'string' &&
    ['active', 'completed', 'archived', 'problem'].includes(obj.status)
  );
}

/**
 * Check if object is a Comment
 * @param {any} obj
 * @returns {boolean}
 */
export function isComment(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.post_id === 'string' &&
    typeof obj.author_email === 'string'
  );
}

/**
 * Check if object has an ID
 * @param {any} obj
 * @returns {boolean}
 */
export function hasId(obj) {
  return obj && typeof obj === 'object' && typeof obj.id === 'string';
}

/**
 * Check if object has an email
 * @param {any} obj
 * @returns {boolean}
 */
export function hasEmail(obj) {
  return obj && typeof obj === 'object' && typeof obj.email === 'string';
}

/**
 * Check if URL is valid media URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidMediaUrl(url) {
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(url);
  } catch {
    return false;
  }
}

/**
 * Assert never - for exhaustive type checking
 * @param {never} value
 * @throws {Error}
 */
export function assertNever(value) {
  throw new Error(`Unexpected value: ${value}`);
}