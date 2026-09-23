import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server authorization check
  const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'OWN_ONLY', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Trainers only see their own assignments
  const trainerId = auth.user?.role === 'TRAINER' ? auth.user.id : searchParams.get('trainerId') || undefined;

  const assignments = db.getPTAssignments(tenantId, trainerId);
  return NextResponse.json({ success: true, assignments });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-1',
      trainerId,
      trainerName,
      memberId,
      memberName,
      memberNumber,
      startDate,
      endDate,
      sessionsTotal,
      feeETB,
      schedule,
      clientPhone,
      notes,
    } = body;

    // Server-side authorization check: Only MANAGERS and OWNERS can assign PT clients
    const auth =  authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const numSessions = sessionsTotal || body.totalSessions;

    if (!trainerId || !trainerName || !memberId || !memberName || !numSessions) {
      return NextResponse.json(
        { success: false, error: 'Missing required PT assignment fields (trainer, member, sessionsTotal)' },
        { status: 400 }
      );
    }

    const assignment = db.createPTAssignment({
      tenantId,
      trainerId,
      trainerName,
      memberId,
      memberName,
      memberNumber: memberNumber || memberId,
      clientPhone,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      sessionsTotal: parseInt(String(numSessions), 10),
      sessionsRemaining: parseInt(String(numSessions), 10),
      feeETB: feeETB ? Number(feeETB) : undefined,
      schedule,
      status: 'ACTIVE',
      notes,
      assignedBy: auth.user?.name || 'Owner',
    });

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role as any,
      action: 'PT_ASSIGNED',
      entityType: 'MEMBER',
      entityId: memberId,
      details: `Booked trainer ${trainerName} for member ${memberName} (${numSessions} sessions${feeETB ? `, ETB ${feeETB}` : ''})`,
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      tenantId = 'tenant-1',
      sessionsCompleted,
      sessionsRemaining,
      sessionsTotal,
      status,
      notes,
      schedule,
      feeETB,
      trainerId,
      trainerName,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Assignment ID is required' }, { status: 400 });
    }

    // Server-side authorization check: Trainer (own) or Manager can update assignment
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'OWN_ONLY', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const current = db.getPTAssignments(tenantId).find((a) => a.id === id);
    if (!current) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    // If Trainer, must be their own assignment and can only log sessions or notes
    if (auth.user?.role === 'TRAINER') {
      if (current.trainerId !== auth.user.id) {
        return NextResponse.json(
          { success: false, error: 'Trainers can only update their own assigned clients' },
          { status: 403 }
        );
      }
    }

    const updates: any = {};
    if (sessionsCompleted !== undefined) {
      const remaining = Math.max(0, current.sessionsRemaining - Number(sessionsCompleted));
      updates.sessionsRemaining = remaining;
      if (remaining === 0) updates.status = 'COMPLETED';
    }
    if (sessionsRemaining !== undefined) updates.sessionsRemaining = Number(sessionsRemaining);
    if (sessionsTotal !== undefined) updates.sessionsTotal = Number(sessionsTotal);
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (schedule) updates.schedule = schedule;
    if (feeETB !== undefined) updates.feeETB = Number(feeETB);
    if (trainerId && trainerName && auth.user?.role !== 'TRAINER') {
      updates.trainerId = trainerId;
      updates.trainerName = trainerName;
    }

    const updated = db.updatePTAssignment(id, updates);
    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Assignment ID is required' }, { status: 400 });
    }

    // Server-side authorization check: Only MANAGERS and OWNERS can delete PT assignments
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'MANAGE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const success = db.deletePTAssignment(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'PT assignment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
