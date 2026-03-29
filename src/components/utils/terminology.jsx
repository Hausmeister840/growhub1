/**
 * GrowHub Canonical Terminology Dictionary
 * Zentrale Stelle für alle UI-Texte – i18n-ready.
 * 
 * Regeln:
 * - "Grower" wird NUR als bewusste Rolle/Titel verwendet, NICHT als Fallback-Name
 * - Fallback für unbekannte Nutzer: "Unbekannter Nutzer"
 * - Fallback für gelöschte Accounts: "Gelöschter Account"
 */

const TERMS = {
  // User terminology
  user: 'Nutzer',
  member: 'Mitglied',
  grower: 'Grower', // NUR als bewusste Rolle, nie als Fallback
  unknownUser: 'Unbekannter Nutzer',
  deletedAccount: 'Gelöschter Account',
  
  // Content
  post: 'Beitrag',
  comment: 'Kommentar',
  reply: 'Antwort',
  entry: 'Tagebucheintrag',
  diary: 'Grow-Tagebuch',
  
  // Actions
  like: 'Gefällt mir',
  share: 'Teilen',
  save: 'Speichern',
  follow: 'Folgen',
  unfollow: 'Nicht mehr folgen',
  report: 'Melden',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  
  // Navigation
  feed: 'Feed',
  explore: 'Entdecken',
  messages: 'Nachrichten',
  profile: 'Profil',
  settings: 'Einstellungen',
  notifications: 'Benachrichtigungen',
  
  // Empty states
  noPostsYet: 'Noch keine Beiträge',
  beTheFirst: 'Sei der Erste und teile etwas mit der Community!',
  noCommentsYet: 'Noch keine Kommentare',
  beFirstComment: 'Sei der Erste!',
  noDiariesYet: 'Noch keine Grow-Tagebücher',
  noFollowersYet: 'Noch keine Follower',
  noFollowingYet: 'Du folgst noch niemandem',
  noResultsFound: 'Keine Ergebnisse gefunden',
  
  // Errors
  loadError: 'Fehler beim Laden',
  tryAgain: 'Erneut versuchen',
  networkError: 'Netzwerkfehler. Bitte überprüfe deine Verbindung.',
  loginRequired: 'Bitte melde dich an',
  actionFailed: 'Aktion fehlgeschlagen',
  
  // Success
  postCreated: 'Beitrag erstellt!',
  postDeleted: 'Beitrag gelöscht',
  commentPosted: 'Kommentar gepostet!',
  linkCopied: 'Link kopiert!',
  profileUpdated: 'Profil aktualisiert!',
  undoAction: 'Rückgängig?',
};

/**
 * Get display name for a user object.
 * Priority: full_name > username > email prefix > "Unbekannter Nutzer"
 */
export function getDisplayName(user) {
  if (!user) return TERMS.unknownUser;
  
  // Priority 1: full_name (skip generic placeholders)
  const fn = (user.full_name || '').trim();
  if (fn && fn !== 'Unknown User' && fn !== 'User' && fn !== 'unknown') {
    return fn;
  }
  
  // Priority 2: username (skip generic placeholders)
  const un = (user.username || '').trim();
  if (un && un !== 'user' && un !== 'grower' && un !== 'nutzer' && un !== 'unknown') {
    return un;
  }
  
  // Priority 3: display_name field (some backends use this)
  const dn = (user.display_name || '').trim();
  if (dn) return dn;
  
  // Priority 4: email prefix — always prefer this over "Unbekannter Nutzer"
  const email = (user.email || '').trim();
  if (email && email !== 'unknown@user.com') {
    return email.split('@')[0];
  }
  
  return TERMS.unknownUser;
}

/**
 * Get user initials for avatar fallback.
 */
export function getInitials(user) {
  if (!user) return '?';
  const name = user.full_name || user.username || user.email || '';
  if (!name) return '?';
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

/**
 * Build a fallback user object for posts where author is missing from cache.
 */
export function buildFallbackUser(email) {
  const cleanEmail = (email || '').trim();
  const prefix = cleanEmail ? cleanEmail.split('@')[0] : '';
  return {
    id: null,
    email: cleanEmail || '',
    full_name: prefix || '',
    username: prefix || '',
    avatar_url: null,
  };
}

export default TERMS;