/**
 * 🎛️ REMOTE CONFIG - Feature Flags
 * @typedef {import('../types').FeatureFlags} FeatureFlags
 */

/** @type {FeatureFlags} */
const DEFAULT_FLAGS = {
  map: true,
  marketplace: true,
  seeds: false,
  live: false,
};

/** @type {Record<string, boolean>} */
const ENABLED_REGIONS = {
  DE: true,
  AT: true,
  CH: true,
  NL: true,
  FR: false,
};

/**
 * @returns {Promise<FeatureFlags>}
 */
export async function loadFeatureFlags() {
  // TODO: Firebase Remote Config integration
  return DEFAULT_FLAGS;
}

/**
 * @param {string} countryCode
 * @returns {boolean}
 */
export function isRegionEnabled(countryCode) {
  return ENABLED_REGIONS[countryCode] ?? false;
}

/**
 * @param {string} countryCode
 * @param {FeatureFlags} flags
 * @returns {boolean}
 */
export function canShowSeeds(countryCode, flags) {
  if (!flags.seeds) return false;
  
  const blockedCountries = ['DE', 'FR'];
  return !blockedCountries.includes(countryCode);
}