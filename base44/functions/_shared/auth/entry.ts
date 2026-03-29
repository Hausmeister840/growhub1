import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

export type GrowHubRole = 'user' | 'moderator' | 'admin';

export function isRoleAllowed(userRole: unknown, allowed: GrowHubRole[]) {
  if (!userRole || typeof userRole !== 'string') return false;
  return allowed.includes(userRole as GrowHubRole);
}

export async function requireUser(req: Request) {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user || !user.id) throw new Error('Authentication required');
    return { base44, user };
  } catch {
    throw new Error('Authentication required');
  }
}

export async function getOptionalUser(req: Request) {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    return { base44, user };
  } catch {
    return { base44, user: null };
  }
}

export async function requireRole(req: Request, allowed: GrowHubRole[]) {
  const { base44, user } = await requireUser(req);
  if (!isRoleAllowed(user?.role, allowed)) {
    throw new Error('Forbidden');
  }
  return { base44, user };
}