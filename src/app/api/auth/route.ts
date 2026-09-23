import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { getAuthenticatedUser } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = getAuthenticatedUser(request);

  // If user is authenticated and not super admin, strictly lock to their tenant
  const tenantId =
    user && user.role !== 'SUPER_ADMIN'
      ? user.tenantId
      : searchParams.get('tenantId') || undefined;

  const users = db.getUsers(tenantId);
  return NextResponse.json({ users });
}
