import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server-side RBAC: Only authorized staff with CHECKIN_QR VIEW permission can view scan history
  const auth = authorizeServerRequest(request, 'CHECKIN_QR', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const checkIns = db.getCheckIns(tenantId, limit);
  const occupancy = db.getLiveOccupancy(tenantId);

  return NextResponse.json({ checkIns, occupancy });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const identifier = body.identifier;
    const method = body.method || 'QR_SCAN';

    // Server-side RBAC: Must have CHECKIN_QR permission to process check-in
    const auth = authorizeServerRequest(request, 'CHECKIN_QR', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier (QR token / Barcode / Phone) is required' }, { status: 400 });
    }

    if (body.action === 'CHECK_OUT') {
      const result = db.processCheckOut(tenantId, identifier);
      return NextResponse.json(result);
    }

    const result = db.processCheckIn(tenantId, identifier, method, {
      actor: auth.user ? { id: auth.user.id, name: auth.user.name, role: auth.user.role } : undefined,
      branchId: body.branchId,
      branchName: body.branchName,
      deviceInfo: request.headers.get('user-agent') || body.deviceInfo,
      allowReEntry: body.allowReEntry === true,
      notes: body.notes,
    });
    const occupancy = db.getLiveOccupancy(tenantId);

    return NextResponse.json({
      ...result,
      occupancy,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Check-in processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
