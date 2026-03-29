/**
 * 🛡️ INPUT VALIDATION & SANITIZATION
 * Central validation utilities for user input
 */

export const validators = {
  /**
   * Validate and sanitize text content (posts, comments, etc.)
   */
  sanitizeText(text, maxLength = 5000) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove potential script tags and dangerous HTML
    const cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return cleaned.slice(0, maxLength).trim();
  },

  /**
   * Validate username (alphanumeric + underscore, 3-30 chars)
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username erforderlich' };
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { valid: false, error: 'Username zu kurz (min. 3 Zeichen)' };
    }
    
    if (trimmed.length > 30) {
      return { valid: false, error: 'Username zu lang (max. 30 Zeichen)' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { valid: false, error: 'Nur Buchstaben, Zahlen und _ erlaubt' };
    }
    
    return { valid: true, value: trimmed };
  },

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      return { valid: false, error: 'Ungültige E-Mail-Adresse' };
    }
    
    return { valid: true, value: email.toLowerCase().trim() };
  },

  /**
   * Validate file upload
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = ['image/*', 'video/*'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov']
    } = options;

    if (!file) {
      return { valid: false, error: 'Keine Datei ausgewählt' };
    }

    // Check size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      return { valid: false, error: `Datei zu groß (max ${sizeMB}MB)` };
    }

    // Check type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const typeMatches = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.split('/')[0];
        return fileType.startsWith(prefix + '/');
      }
      return fileType === type;
    });

    const extMatches = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!typeMatches || !extMatches) {
      return { valid: false, error: 'Dateityp nicht erlaubt' };
    }

    return { valid: true, value: file };
  },

  /**
   * Validate URL
   */
  validateUrl(url) {
    if (!url) return { valid: true, value: null };
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Nur HTTP/HTTPS URLs erlaubt' };
      }
      return { valid: true, value: parsed.href };
    } catch {
      return { valid: false, error: 'Ungültige URL' };
    }
  },

  /**
   * Validate price (positive number, max 2 decimals)
   */
  validatePrice(price) {
    const num = parseFloat(price);
    
    if (isNaN(num) || num < 0) {
      return { valid: false, error: 'Ungültiger Preis' };
    }
    
    if (num > 999999) {
      return { valid: false, error: 'Preis zu hoch' };
    }
    
    // Round to 2 decimals
    const rounded = Math.round(num * 100) / 100;
    
    return { valid: true, value: rounded };
  },

  /**
   * Validate tags array
   */
  validateTags(tags, maxTags = 10, maxLength = 30) {
    if (!Array.isArray(tags)) return { valid: false, error: 'Tags müssen ein Array sein' };
    
    if (tags.length > maxTags) {
      return { valid: false, error: `Maximal ${maxTags} Tags erlaubt` };
    }
    
    const cleaned = tags
      .filter(tag => typeof tag === 'string' && tag.trim())
      .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9äöüß]/g, ''))
      .filter(tag => tag.length > 0 && tag.length <= maxLength)
      .slice(0, maxTags);
    
    return { valid: true, value: cleaned };
  },

  /**
   * Check for spam/abuse patterns
   */
  detectSpam(text) {
    if (!text) return { isSpam: false };
    
    const lowerText = text.toLowerCase();
    
    // Patterns
    const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const repeatedChars = /(.)\1{10,}/;
    const allCaps = text.length > 20 && text === text.toUpperCase();
    
    const spamKeywords = [
      'verkaufe', 'verkauf', 'kaufen', 'dealer', 'whatsapp',
      'telegram', 'wickr', 'kontakt mich', 'dm me', 'link in bio'
    ];
    
    const hasSpamKeyword = spamKeywords.some(kw => lowerText.includes(kw));
    const hasPhone = phonePattern.test(text);
    const hasMultipleUrls = (text.match(urlPattern) || []).length > 2;
    const hasRepeatedChars = repeatedChars.test(text);
    
    const isSpam = hasSpamKeyword || hasPhone || hasMultipleUrls || hasRepeatedChars || allCaps;
    
    return {
      isSpam,
      reasons: [
        hasSpamKeyword && 'Spam-Keywords',
        hasPhone && 'Telefonnummer',
        hasMultipleUrls && 'Zu viele Links',
        hasRepeatedChars && 'Spam-Muster',
        allCaps && 'Nur Großbuchstaben'
      ].filter(Boolean)
    };
  }
};

export default validators;