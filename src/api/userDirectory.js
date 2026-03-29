import { base44 } from '@/api/base44Client';

const DIRECTORY_TTL_MS = 60_000;
const DIRECTORY_POOL_SIZE = 250;

const cacheById = new Map();
const cacheByEmail = new Map();
const inflightRequests = new Map();

let directorySnapshot = [];
let directoryLoadedAt = 0;

const normalizeEmail = (email) => (
  typeof email === 'string' ? email.trim().toLowerCase() : ''
);

export const normalizeUser = (user) => {
  if (!user) return null;

  const data = user.data && typeof user.data === 'object' ? user.data : {};
  const merged = { ...data, ...user };
  const email = user.email || data.email || '';
  const emailKey = normalizeEmail(email);
  const fallbackName = merged.full_name || merged.username || emailKey.split('@')[0] || 'Nutzer';

  return {
    ...merged,
    id: user.id || merged.id || emailKey,
    email,
    full_name: merged.full_name || fallbackName,
    username: merged.username || emailKey.split('@')[0] || fallbackName,
    avatar_url: merged.avatar_url || null,
    bio: merged.bio || '',
    verified: Boolean(merged.verified || merged.is_verified),
    notification_settings: merged.notification_settings || {},
    last_seen: merged.last_seen || merged.updated_date || merged.created_date || null,
  };
};

const rememberUser = (rawUser) => {
  const user = normalizeUser(rawUser);
  if (!user?.id) return null;

  cacheById.set(user.id, user);

  const emailKey = normalizeEmail(user.email);
  if (emailKey) {
    cacheByEmail.set(emailKey, user);
    cacheByEmail.set(user.email, user);
  }

  return user;
};

export const mergeUsers = (...groups) => {
  const usersByKey = new Map();

  groups.flat().forEach((rawUser) => {
    const user = rememberUser(rawUser);
    if (!user) return;

    const key = user.id || normalizeEmail(user.email);
    if (key) {
      usersByKey.set(key, user);
    }
  });

  return Array.from(usersByKey.values());
};

export const buildUserLookup = (users = []) => {
  const lookup = {};

  mergeUsers(users).forEach((user) => {
    if (!user) return;

    lookup[user.id] = user;

    const emailKey = normalizeEmail(user.email);
    if (emailKey) {
      lookup[emailKey] = user;
      lookup[user.email] = user;
    }
  });

  return lookup;
};

export const primeUserCache = (users = []) => mergeUsers(users);

async function fetchUser(field, value) {
  const normalizedValue = field === 'email' ? normalizeEmail(value) : value;
  if (!normalizedValue) return null;

  const cached = field === 'email'
    ? cacheByEmail.get(normalizedValue) || cacheByEmail.get(value)
    : cacheById.get(normalizedValue);

  if (cached) return cached;

  const requestKey = `${field}:${normalizedValue}`;
  if (inflightRequests.has(requestKey)) {
    return inflightRequests.get(requestKey);
  }

  const request = base44.entities.User.filter({ [field]: normalizedValue }, '-created_date', 1)
    .then((results) => rememberUser(results?.[0]) || null)
    .catch(() => null)
    .finally(() => inflightRequests.delete(requestKey));

  inflightRequests.set(requestKey, request);
  return request;
}

export const fetchUserById = async (id) => fetchUser('id', id);

export const fetchUserByEmail = async (email) => fetchUser('email', email);

export const fetchUsersByIds = async (ids = []) => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  const users = await Promise.all(uniqueIds.map((id) => fetchUserById(id)));
  return users.filter(Boolean);
};

export const fetchUsersByEmails = async (emails = []) => {
  const uniqueEmails = [...new Set((emails || []).map(normalizeEmail).filter(Boolean))];
  const users = await Promise.all(uniqueEmails.map((email) => fetchUserByEmail(email)));
  return users.filter(Boolean);
};

async function loadDirectorySnapshot(forceRefresh = false, minimumSize = DIRECTORY_POOL_SIZE) {
  const isFresh = directorySnapshot.length > 0 && (Date.now() - directoryLoadedAt) < DIRECTORY_TTL_MS;
  if (!forceRefresh && isFresh && directorySnapshot.length >= Math.min(minimumSize, DIRECTORY_POOL_SIZE)) {
    return directorySnapshot;
  }

  const rawUsers = await base44.entities.User.list('-created_date', Math.max(minimumSize, DIRECTORY_POOL_SIZE));
  directorySnapshot = mergeUsers(rawUsers);
  directoryLoadedAt = Date.now();

  return directorySnapshot;
}

export const searchDirectoryUsers = async (query = '', { limit = 50, forceRefresh = false } = {}) => {
  const normalizedQuery = query.trim().toLowerCase();
  const pool = await loadDirectorySnapshot(forceRefresh, Math.max(limit * 4, 80));

  if (!normalizedQuery) {
    return pool.slice(0, limit);
  }

  return pool
    .filter((user) => [user.full_name, user.username, user.email]
      .some((value) => typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)))
    .slice(0, limit);
};

export const findUserByIdentifier = async (identifier) => {
  const target = typeof identifier === 'string' ? identifier.trim() : '';
  if (!target) return null;

  if (target.includes('@') && !target.startsWith('@')) {
    return fetchUserByEmail(target);
  }

  const byId = await fetchUserById(target);
  if (byId) {
    return byId;
  }

  const normalizedTarget = target.startsWith('@') ? target.slice(1).toLowerCase() : target.toLowerCase();
  const matches = await searchDirectoryUsers(normalizedTarget, { limit: 30 });

  return matches.find((user) => {
    const username = typeof user.username === 'string' ? user.username.toLowerCase() : '';
    const handle = typeof user.handle === 'string' ? user.handle.toLowerCase() : '';
    return username === normalizedTarget || handle === `@${normalizedTarget}` || handle === target.toLowerCase();
  }) || null;
};
