import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const memberId = body.memberId;
    const action = body.action; // 'REVOKE' | 'REGENERATE'

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    if (action !== 'REVOKE' && action !== 'REGENERATE') {
      return NextResponse.json({ error: 'Valid action (REVOKE or REGENERATE) is required' }, { status: 400 });
    }

    // Server-side authorization check: Staff with MEMBER_PROFILE_MANAGE CREATE_UPDATE permission
    const auth = authorizeServerRequest(request, 'MEMBER_PROFILE_MANAGE', 'CREATE_UPDATE', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const actor = auth.user
      ? { id: auth.user.id, name: auth.user.name, role: auth.user.role }
      : undefined;

    if (action === 'REVOKE') {
      const result = db.revokeMemberQRCode(tenantId, memberId, actor);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        action: 'REVOKE',
        message: result.message,
        member: result.member,
      });
    }

    // action === 'REGENERATE'
    const result = db.regenerateMemberQRCode(tenantId, memberId, actor);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      action: 'REGENERATE',
      message: result.message,
      oldToken: result.oldToken,
      newToken: result.newToken,
      member: result.member,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'QR code operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
