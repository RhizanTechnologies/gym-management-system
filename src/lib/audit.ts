import { db } from './storage';
import { AuditEvent, AuditAction } from './types';

/**
 * Record an immutable audit event in the system.
 * Audit events cannot be modified or deleted.
 */
export function recordAuditEvent(params: {
  tenantId: string;
  branchId?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
}): AuditEvent {
  return db.recordAuditEvent(params);
}

/**
 * Retrieve audit events for a tenant with optional filtering.
 */
export function getAuditEvents(
  tenantId: string,
  filters?: { actorId?: string; action?: string; entityType?: string }
): AuditEvent[] {
  return db.getAuditEvents(tenantId, filters);
}
