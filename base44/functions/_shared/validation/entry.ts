/**
 * 🛡️ INPUT VALIDATION
 * Validates user inputs
 */

/**
 * Email validation
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Username validation
 */
export function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  
  // 3-30 characters, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Content validation (posts, comments)
 */
export function isValidContent(content, options = {}) {
  const { minLength = 1, maxLength = 5000, allowEmpty = false } = options;
  
  if (!content) return allowEmpty;
  if (typeof content !== 'string') return false;
  
  const trimmed = content.trim();
  if (!allowEmpty && trimmed.length === 0) return false;
  if (trimmed.length < minLength) return false;
  if (trimmed.length > maxLength) return false;
  
  return true;
}

/**
 * Checks for SQL injection patterns
 */
export function hasSqlInjection(str) {
  if (!str || typeof str !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bUNION\b.*\bSELECT\b)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(str));
}

/**
 * Checks for XSS patterns
 */
export function hasXss(str) {
  if (!str || typeof str !== 'string') return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(str));
}

/**
 * Validates object against schema
 */
export function validateSchema(obj, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    // Required check
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip further validation if not present and not required
    if (value === undefined || value === null) continue;

    // Type check
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} has invalid format`);
      }
      if (rules.email && !isValidEmail(value)) {
        errors.push(`${key} must be a valid email`);
      }
      if (rules.url && !isValidUrl(value)) {
        errors.push(`${key} must be a valid URL`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${key} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${key} must be at most ${rules.max}`);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${key} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${key} must have at most ${rules.maxItems} items`);
      }
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validator
    if (rules.validator && !rules.validator(value)) {
      errors.push(`${key} failed custom validation`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize HTML
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}