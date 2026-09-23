import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Enforce server-side authorization: Full/Manage export capability required
  // Receptionists and Trainers only have VIEW (daily operational) or NONE, so MANAGE blocks unauthorized directory exports
  const auth = authorizeServerRequest(request, 'REPORTS_EXPORTS', 'MANAGE', tenantId);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED', message: auth.error },
      { status: auth.status }
    );
  }

  const members = db.getMembers(tenantId);

  // Generate CSV data
  const headers = 'MemberNumber,FirstName,LastName,Phone,Email,Status,Plan,DaysRemaining,DueBalance,JoinDate\n';
  const rows = members
    .map(
      (m) =>
        `"${m.memberNumber}","${m.firstName}","${m.lastName}","${m.phone}","${m.email || ''}","${m.status}","${
          m.currentPlanName || ''
        }",${m.daysRemaining ?? ''},${m.dueBalance},"${m.joinDate}"`
    )
    .join('\n');

  // Record audit event for export execution
  db.recordAuditEvent({
    tenantId,
    actorId: auth.user!.id,
    actorName: auth.user!.name,
    actorRole: auth.user!.role,
    action: 'EXPORT_EXECUTED',
    entityType: 'MEMBER_DIRECTORY',
    details: `Exported ${members.length} member records as CSV by ${auth.user!.name} (${auth.user!.role})`,
  });

  return new NextResponse(headers + rows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="members-${tenantId}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
