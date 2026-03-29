/**
 * 🛡️ RUNTIME VALIDATION
 * Simple validation helpers (no Zod dependency)
 */

/**
 * Validates a post object
 * @param {any} data
 * @returns {{success: boolean, error?: string, data?: any}}
 */
export function validatePost(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid post data' };
  }

  if (!data.id || typeof data.id !== 'string') {
    return { success: false, error: 'Missing post ID' };
  }

  if (!['draft', 'under_review', 'published', 'removed'].includes(data.status)) {
    return { success: false, error: 'Invalid post status' };
  }

  return { success: true, data };
}

/**
 * Validates create post data
 * @param {any} data
 * @returns {{success: boolean, error?: string, data?: any}}
 */
export function validateCreatePost(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data' };
  }

  const hasContent = data.content && data.content.trim().length > 0;
  const hasMedia = data.media_urls && data.media_urls.length > 0;

  if (!hasContent && !hasMedia) {
    return { success: false, error: 'Post must have content or media' };
  }

  if (data.content && data.content.length > 5000) {
    return { success: false, error: 'Content too long (max 5000 chars)' };
  }

  return { success: true, data };
}

/**
 * Validates user object
 * @param {any} data
 * @returns {{success: boolean, error?: string, data?: any}}
 */
export function validateUser(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid user data' };
  }

  if (!data.email || !data.email.includes('@')) {
    return { success: false, error: 'Invalid email' };
  }

  if (!['admin', 'user'].includes(data.role)) {
    return { success: false, error: 'Invalid role' };
  }

  return { success: true, data };
}

/**
 * Validates grow diary object
 * @param {any} data
 * @returns {{success: boolean, error?: string, data?: any}}
 */
export function validateGrowDiary(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid diary data' };
  }

  if (!data.name || data.name.length < 1) {
    return { success: false, error: 'Diary name required' };
  }

  if (!data.strain_name) {
    return { success: false, error: 'Strain name required' };
  }

  const validStatuses = ['active', 'completed', 'archived', 'problem'];
  if (data.status && !validStatuses.includes(data.status)) {
    return { success: false, error: 'Invalid status' };
  }

  return { success: true, data };
}

/**
 * Validates location coordinates
 * @param {any} data
 * @returns {{success: boolean, error?: string, data?: any}}
 */
export function validateLocation(data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid location data' };
  }

  const lat = parseFloat(data.lat);
  const lng = parseFloat(data.lng);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { success: false, error: 'Invalid latitude' };
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    return { success: false, error: 'Invalid longitude' };
  }

  return { success: true, data: { lat, lng } };
}

/**
 * Formats validation error
 * @param {string} error
 * @returns {string}
 */
export function formatValidationError(error) {
  return error || 'Validation failed';
}

/**
 * Sanitizes text input
 * @param {string} text
 * @returns {string}
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validates URL format
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}