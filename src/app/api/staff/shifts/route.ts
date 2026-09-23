import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';
  const date = searchParams.get('date') || undefined;

  // Server authorization check: Role must be allowed to view schedules
  const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'OWN_ONLY', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // If user role has OWN_ONLY access (Trainer, Receptionist), scope to their own shifts
  const isOwnOnly = auth.user?.role === 'TRAINER' || auth.user?.role === 'RECEPTIONIST' || auth.user?.role === 'MAINTENANCE_STAFF';
  const userId = isOwnOnly && auth.user ? auth.user.id : searchParams.get('userId') || undefined;

  const shifts = db.getStaffShifts(tenantId, { date, userId });
  return NextResponse.json({ success: true, shifts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-1',
      userId,
      userName,
      userRole,
      shiftType = 'MORNING',
      date,
      startTime,
      endTime,
      notes,
    } = body;

    // Server-side authorization check: Only MANAGERS and OWNERS can create/assign shifts
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!userId || !userName || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required shift fields (userId, userName, date, startTime, endTime)' },
        { status: 400 }
      );
    }

    const shift = db.createStaffShift({
      tenantId,
      userId,
      userName,
      userRole: userRole || 'RECEPTIONIST',
      shiftType,
      date,
      startTime,
      endTime,
      status: 'SCHEDULED',
      notes,
    });

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role as any,
      action: 'SHIFT_ASSIGNED',
      entityType: 'SHIFT',
      entityId: shift.id,
      details: `Scheduled ${shiftType} shift for ${userName} (${userRole}) on ${date} (${startTime}-${endTime})`,
    });

    return NextResponse.json({ success: true, shift }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, action, tenantId = 'tenant-1' } = body;

    if (!shiftId || !action) {
      return NextResponse.json(
        { success: false, error: 'shiftId and action (CLOCK_IN or CLOCK_OUT) are required' },
        { status: 400 }
      );
    }

    // Server-side authorization check
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'OWN_ONLY', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const updated = db.clockInOutShift(shiftId, action);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shift: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
