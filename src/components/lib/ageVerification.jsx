/**
 * 🔞 AGE VERIFICATION UTILITIES
 */

/**
 * Check if user has verified their age
 * @returns {boolean}
 */
export function isAgeVerified() {
  if (typeof window === 'undefined') return false;
  
  const verified = localStorage.getItem('growhub_age_verified');
  if (!verified) return false;
  
  try {
    const verifiedDate = new Date(verified);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Age verification expires after 1 year
    return verifiedDate > oneYearAgo;
  } catch {
    return false;
  }
}

/**
 * Set age verification
 */
export function setAgeVerified() {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('growhub_age_verified', new Date().toISOString());
}

/**
 * Clear age verification
 */
export function clearAgeVerification() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('growhub_age_verified');
}

/**
 * Get age verification date
 * @returns {Date | null}
 */
export function getAgeVerificationDate() {
  if (typeof window === 'undefined') return null;
  
  const verified = localStorage.getItem('growhub_age_verified');
  if (!verified) return null;
  
  try {
    return new Date(verified);
  } catch {
    return null;
  }
}