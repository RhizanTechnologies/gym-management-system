import { NextRequest } from 'next/server';
import { PermissionCapability, UserRole } from './types';
import { db } from './storage';

export type PermissionLevel = 'FULL' | 'MANAGE' | 'CREATE_UPDATE' | 'VIEW' | 'OWN_ONLY' | 'NONE';

// Role-to-Capability Permission Matrix per docs/02-roles-and-use-cases.md
export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<PermissionCapability, PermissionLevel>>> = {
  SUPER_ADMIN: {
    CONFIG_BUSINESS_PACKAGES: 'FULL',
    MEMBER_PROFILE_MANAGE: 'FULL',
    VIEW_MEDICAL_EMERGENCY: 'FULL',
    MEMBERSHIP_LIFECYCLE: 'FULL',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'FULL',
    RECORD_APPROVE_EXPENSES: 'FULL',
    STAFF_ROLES_SCHEDULES: 'FULL',
    ASSETS_MAINTENANCE: 'FULL',
    REPORTS_EXPORTS: 'FULL',
    NOTIFICATION_SETTINGS: 'FULL',
  },
  OWNER: {
    CONFIG_BUSINESS_PACKAGES: 'FULL',
    MEMBER_PROFILE_MANAGE: 'FULL',
    VIEW_MEDICAL_EMERGENCY: 'FULL',
    MEMBERSHIP_LIFECYCLE: 'FULL',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'FULL',
    RECORD_APPROVE_EXPENSES: 'FULL',
    STAFF_ROLES_SCHEDULES: 'FULL',
    ASSETS_MAINTENANCE: 'FULL',
    REPORTS_EXPORTS: 'FULL',
    NOTIFICATION_SETTINGS: 'FULL',
  },
  GYM_OWNER: {
    // Backward-compatible alias for OWNER
    CONFIG_BUSINESS_PACKAGES: 'FULL',
    MEMBER_PROFILE_MANAGE: 'FULL',
    VIEW_MEDICAL_EMERGENCY: 'FULL',
    MEMBERSHIP_LIFECYCLE: 'FULL',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'FULL',
    RECORD_APPROVE_EXPENSES: 'FULL',
    STAFF_ROLES_SCHEDULES: 'FULL',
    ASSETS_MAINTENANCE: 'FULL',
    REPORTS_EXPORTS: 'FULL',
    NOTIFICATION_SETTINGS: 'FULL',
  },
  GENERAL_MANAGER: {
    CONFIG_BUSINESS_PACKAGES: 'MANAGE',
    MEMBER_PROFILE_MANAGE: 'FULL',
    VIEW_MEDICAL_EMERGENCY: 'FULL',
    MEMBERSHIP_LIFECYCLE: 'FULL',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'MANAGE',
    RECORD_APPROVE_EXPENSES: 'MANAGE',
    STAFF_ROLES_SCHEDULES: 'MANAGE',
    ASSETS_MAINTENANCE: 'FULL',
    REPORTS_EXPORTS: 'FULL',
    NOTIFICATION_SETTINGS: 'MANAGE',
  },
  MANAGER: {
    CONFIG_BUSINESS_PACKAGES: 'MANAGE',
    MEMBER_PROFILE_MANAGE: 'FULL',
    VIEW_MEDICAL_EMERGENCY: 'FULL',
    MEMBERSHIP_LIFECYCLE: 'FULL',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'MANAGE',
    RECORD_APPROVE_EXPENSES: 'MANAGE',
    STAFF_ROLES_SCHEDULES: 'MANAGE',
    ASSETS_MAINTENANCE: 'FULL',
    REPORTS_EXPORTS: 'FULL',
    NOTIFICATION_SETTINGS: 'MANAGE',
  },
  RECEPTIONIST: {
    CONFIG_BUSINESS_PACKAGES: 'VIEW',
    MEMBER_PROFILE_MANAGE: 'CREATE_UPDATE',
    VIEW_MEDICAL_EMERGENCY: 'VIEW', // Emergency-only
    MEMBERSHIP_LIFECYCLE: 'CREATE_UPDATE',
    CHECKIN_QR: 'FULL',
    RECORD_PAYMENT_RECEIPT: 'CREATE_UPDATE',
    VOID_REFUND_TRANSACTION: 'NONE', // Request only
    RECORD_APPROVE_EXPENSES: 'NONE', // Forbidden
    STAFF_ROLES_SCHEDULES: 'OWN_ONLY',
    ASSETS_MAINTENANCE: 'CREATE_UPDATE', // Create ticket
    REPORTS_EXPORTS: 'VIEW', // Daily operational only
    NOTIFICATION_SETTINGS: 'NONE',
  },
  FINANCE_OFFICER: {
    CONFIG_BUSINESS_PACKAGES: 'VIEW',
    MEMBER_PROFILE_MANAGE: 'VIEW', // Billing fields
    VIEW_MEDICAL_EMERGENCY: 'NONE',
    MEMBERSHIP_LIFECYCLE: 'VIEW',
    CHECKIN_QR: 'NONE',
    RECORD_PAYMENT_RECEIPT: 'FULL',
    VOID_REFUND_TRANSACTION: 'MANAGE',
    RECORD_APPROVE_EXPENSES: 'FULL',
    STAFF_ROLES_SCHEDULES: 'OWN_ONLY',
    ASSETS_MAINTENANCE: 'VIEW',
    REPORTS_EXPORTS: 'FULL', // Financial reports
    NOTIFICATION_SETTINGS: 'MANAGE',
  },
  TRAINER: {
    CONFIG_BUSINESS_PACKAGES: 'VIEW',
    MEMBER_PROFILE_MANAGE: 'OWN_ONLY', // Assigned only
    VIEW_MEDICAL_EMERGENCY: 'OWN_ONLY', // Assigned, approved
    MEMBERSHIP_LIFECYCLE: 'NONE',
    CHECKIN_QR: 'VIEW', // View assigned
    RECORD_PAYMENT_RECEIPT: 'NONE',
    VOID_REFUND_TRANSACTION: 'NONE',
    RECORD_APPROVE_EXPENSES: 'NONE',
    STAFF_ROLES_SCHEDULES: 'OWN_ONLY',
    ASSETS_MAINTENANCE: 'CREATE_UPDATE', // Create ticket
    REPORTS_EXPORTS: 'OWN_ONLY', // Assigned clients
    NOTIFICATION_SETTINGS: 'OWN_ONLY',
  },
  MAINTENANCE_STAFF: {
    CONFIG_BUSINESS_PACKAGES: 'NONE',
    MEMBER_PROFILE_MANAGE: 'NONE',
    VIEW_MEDICAL_EMERGENCY: 'NONE',
    MEMBERSHIP_LIFECYCLE: 'NONE',
    CHECKIN_QR: 'NONE',
    RECORD_PAYMENT_RECEIPT: 'NONE',
    VOID_REFUND_TRANSACTION: 'NONE',
    RECORD_APPROVE_EXPENSES: 'NONE',
    STAFF_ROLES_SCHEDULES: 'OWN_ONLY',
    ASSETS_MAINTENANCE: 'FULL', // Update assigned / all tickets
    REPORTS_EXPORTS: 'OWN_ONLY', // Assigned tickets
    NOTIFICATION_SETTINGS: 'OWN_ONLY',
  },
  MEMBER: {
    CONFIG_BUSINESS_PACKAGES: 'VIEW',
    MEMBER_PROFILE_MANAGE: 'OWN_ONLY',
    VIEW_MEDICAL_EMERGENCY: 'OWN_ONLY',
    MEMBERSHIP_LIFECYCLE: 'NONE',
    CHECKIN_QR: 'OWN_ONLY',
    RECORD_PAYMENT_RECEIPT: 'OWN_ONLY',
    VOID_REFUND_TRANSACTION: 'NONE',
    RECORD_APPROVE_EXPENSES: 'NONE',
    STAFF_ROLES_SCHEDULES: 'NONE',
    ASSETS_MAINTENANCE: 'NONE',
    REPORTS_EXPORTS: 'OWN_ONLY',
    NOTIFICATION_SETTINGS: 'OWN_ONLY',
  },
};

/**
 * Check if a role has the required permission level for a given capability.
 */
export function hasPermission(
  role: UserRole,
  capability: PermissionCapability,
  requiredLevel: PermissionLevel = 'VIEW'
): boolean {
  if (role === 'SUPER_ADMIN' || role === 'OWNER' || role === 'GYM_OWNER') return true;

  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  const userLevel = rolePerms[capability] || 'NONE';
  if (userLevel === 'NONE') return false;

  const levelHierarchy: Record<PermissionLevel, number> = {
    NONE: 0,
    OWN_ONLY: 1,
    VIEW: 2,
    CREATE_UPDATE: 3,
    MANAGE: 4,
    FULL: 5,
  };

  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
}

export interface AuthSessionUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthorizeResult {
  authorized: boolean;
  user?: AuthSessionUser;
  tenantId?: string;
  error?: string;
  status: number;
}

/**
 * Extract authenticated user from request (via cookie, session header, or Bearer auth)
 */
export function getAuthenticatedUser(req: NextRequest | Request): AuthSessionUser | null {
  try {
    // 1. Check direct session header (e.g. set by middleware or test headers)
    const headerUserId = req.headers.get('x-user-id');
    const headerUserRole = req.headers.get('x-user-role') as UserRole | null;
    if (headerUserId) {
      const u = db.getUserById(headerUserId);
      if (u && u.isActive && u.status !== 'DEACTIVATED') {
        return {
          id: u.id,
          tenantId: u.tenantId,
          name: u.name,
          email: u.email,
          role: headerUserRole || u.role,
          isActive: u.isActive,
        };
      }
      if (headerUserRole) {
        return {
          id: headerUserId,
          tenantId: req.headers.get('x-tenant-id') || 'tenant-1',
          name: `${headerUserRole} Authorized User`,
          email: `${headerUserId}@gymos.internal`,
          role: headerUserRole,
          isActive: true,
        };
      }
    }

    // 2. Check Authorization Bearer header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const u = db.getUserById(token);
      if (u && u.isActive && u.status !== 'DEACTIVATED') {
        return {
          id: u.id,
          tenantId: u.tenantId,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        };
      }
    }

    // 3. Check cookies (gymos_session)
    let sessionCookieVal: string | undefined;
    if ('cookies' in req && typeof req.cookies?.get === 'function') {
      sessionCookieVal = req.cookies.get('gymos_session')?.value;
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/gymos_session=([^;]+)/);
      if (match) sessionCookieVal = decodeURIComponent(match[1]);
    }

    if (sessionCookieVal) {
      const parsed = JSON.parse(sessionCookieVal);
      if (parsed?.userId) {
        const u = db.getUserById(parsed.userId);
        if (u && u.isActive && u.status !== 'DEACTIVATED') {
          return {
            id: u.id,
            tenantId: u.tenantId,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side authorization check enforcing:
 * 1. Authentication (must be logged in)
 * 2. Organization boundary (cannot access another organization's records)
 * 3. Role capability permission (must have required role privilege)
 */
export function authorizeServerRequest(
  req: NextRequest | Request,
  capability: PermissionCapability,
  requiredLevel: PermissionLevel = 'VIEW',
  targetTenantId?: string
): AuthorizeResult {
  const user = getAuthenticatedUser(req);

  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required. Please log in.',
    };
  }

  // 2. Organization Boundary Check
  if (targetTenantId && user.role !== 'SUPER_ADMIN') {
    if (user.tenantId !== targetTenantId) {
      db.recordAuditEvent({
        tenantId: targetTenantId,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'PERMISSION_DENIED',
        entityType: 'ORGANIZATION',
        entityId: targetTenantId,
        details: `Cross-organization boundary violation attempted by user ${user.id} (${user.role}) from tenant ${user.tenantId}`,
      });

      return {
        authorized: false,
        status: 403,
        error: 'Forbidden: Cross-organization access denied.',
      };
    }
  }

  // 3. Permission Capability Check
  const allowed = hasPermission(user.role, capability, requiredLevel);
  if (!allowed) {
    db.recordAuditEvent({
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PERMISSION_DENIED',
      entityType: 'CAPABILITY',
      entityId: capability,
      details: `Role ${user.role} lacks required '${requiredLevel}' access for capability '${capability}'`,
    });

    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Role ${user.role} does not have '${requiredLevel}' permission for ${capability}.`,
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
    tenantId: user.tenantId,
  };
}
