/**
 * ✅ VALIDATION UTILITIES - SINGLE SOURCE (Frontend)
 */

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username) {
  if (!username || username.length < 3) return false;
  if (username.length > 30) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}

export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password) {
  if (!password || password.length < 8) return false;
  return true;
}

export function sanitizeInput(input) {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}

export function validateFileSize(file, maxSizeMB = 5) {
  return file && file.size <= maxSizeMB * 1024 * 1024;
}

export function validateImageFile(file) {
  if (!file) return false;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

export function validateVideoFile(file) {
  if (!file) return false;
  const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
  return allowedTypes.includes(file.type);
}