/**
 * Batched User-Lookups für Posts (created_by = Email, created_by_id = User.id).
 * Vermeidet N+1-Filter in Schleifen.
 */

export async function fetchUsersForPosts(base44, posts, options = {}) {
  const useServiceRole = options.serviceRole !== false;
  const client = useServiceRole ? base44.asServiceRole : base44;

  const emailSet = new Set();
  const idSet = new Set();

  for (const p of posts || []) {
    if (p?.created_by_id && typeof p.created_by_id === 'string') {
      idSet.add(p.created_by_id.trim());
    }
    if (p?.created_by && typeof p.created_by === 'string') {
      emailSet.add(p.created_by.trim().toLowerCase());
    }
  }

  const emails = [...emailSet];
  const ids = [...idSet];

  const [byEmail, byId] = await Promise.all([
    emails.length > 0
      ? client.entities.User.filter({ email: { $in: emails } }).catch(() => [])
      : [],
    ids.length > 0
      ? client.entities.User.filter({ id: { $in: ids } }).catch(() => [])
      : []
  ]);

  const list = [...(byEmail || []), ...(byId || [])];
  const byIdMap = new Map();

  for (const u of list) {
    if (u?.id) {
      byIdMap.set(u.id, u);
    }
  }

  return byIdMap;
}
