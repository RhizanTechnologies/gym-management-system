import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedTenantId = searchParams.get('tenantId') || undefined;

  // Authorization check: only OWNER, GENERAL_MANAGER, and SUPER_ADMIN can view audit events
  const auth = authorizeServerRequest(
    request,
    'REPORTS_EXPORTS',
    'FULL',
    requestedTenantId
  );

  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const tenantId = requestedTenantId || auth.tenantId || 'tenant-1';
  const actorId = searchParams.get('actorId') || undefined;
  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;

  const events = db.getAuditEvents(tenantId, { actorId, action, entityType });
  return NextResponse.json({ success: true, events });
}
