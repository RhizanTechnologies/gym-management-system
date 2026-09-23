import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const member = db.getMemberById(tenantId, id);
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const safeMember = db.maskMemberMedicalData(member, auth.user?.role);
  return NextResponse.json({ member: safeMember });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const actor = auth.user ? { id: auth.user.id, name: auth.user.name, role: auth.user.role } : undefined;

    if (body.action === 'RENEW') {
      const updated = db.renewMemberSubscription(
        tenantId,
        id,
        body.planId,
        body.paymentMethod || 'CASH',
        actor
      );
      if (!updated) {
        return NextResponse.json({ error: 'Failed to renew subscription' }, { status: 400 });
      }
      return NextResponse.json({
        member: db.maskMemberMedicalData(updated, auth.user?.role),
        message: 'Membership renewed successfully!',
      });
    }

    if (body.status === 'FROZEN') {
      const frozen = db.freezeMember(tenantId, id, body.freezeDays || 30, actor);
      if (!frozen) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      return NextResponse.json({
        member: db.maskMemberMedicalData(frozen, auth.user?.role),
        message: 'Membership frozen for 30 days',
      });
    }

    if (body.action === 'UNFREEZE') {
      const unfrozen = db.unfreezeMember(tenantId, id, actor);
      if (!unfrozen) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      return NextResponse.json({
        member: db.maskMemberMedicalData(unfrozen, auth.user?.role),
        message: 'Membership un-frozen and active',
      });
    }

    const updated = db.updateMember(tenantId, id, body, actor);
    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: db.maskMemberMedicalData(updated, auth.user?.role) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const tenantId = body.tenantId || searchParams.get('tenantId') || 'tenant-1';

    // Deleting member profiles requires FULL management permissions (OWNER, SUPER_ADMIN)
    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const actor = auth.user ? { id: auth.user.id, name: auth.user.name, role: auth.user.role } : undefined;
    const success = db.deleteMember(tenantId, id, actor);
    if (!success) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
