import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  const lockers = db.getLockers(tenantId);
  return NextResponse.json({ lockers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    if (body.action === 'CREATE_LOCKER') {
      if (!body.number) {
        return NextResponse.json({ error: 'Locker number is required' }, { status: 400 });
      }
      const locker = db.createLocker(tenantId, {
        number: body.number,
        zone: body.zone || 'Main Zone',
      });
      return NextResponse.json({ locker }, { status: 201 });
    }

    if (body.action === 'UPDATE_LOCKER') {
      const locker = db.updateLocker(tenantId, body.id, body.updates);
      if (!locker) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      return NextResponse.json({ locker });
    }

    if (body.action === 'DELETE_LOCKER') {
      const success = db.deleteLocker(tenantId, body.id);
      if (!success) {
        return NextResponse.json({ error: 'Locker not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Locker deleted' });
    }

    if (body.action === 'ASSIGN') {
      if (!body.lockerNumber || !body.memberId) {
        return NextResponse.json({ error: 'Locker number and Member ID are required' }, { status: 400 });
      }

      const locker = db.assignLocker(
        tenantId,
        body.lockerNumber,
        body.memberId,
        body.memberName || 'Member',
        body.memberPhone || '',
        body.expiresAt
      );

      return NextResponse.json({ locker });
    }

    if (body.action === 'RELEASE') {
      if (!body.lockerNumber) {
        return NextResponse.json({ error: 'Locker number is required' }, { status: 400 });
      }

      const success = db.releaseLocker(tenantId, body.lockerNumber);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid locker action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Locker action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
