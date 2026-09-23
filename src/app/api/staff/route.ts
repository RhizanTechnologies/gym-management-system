import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { authorizeServerRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'tenant-1';

  // Server authorization check: View staff
  const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'VIEW', tenantId);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const users = db.getUsers(tenantId);
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';

    // Server-side authorization check: Only OWNER can create staff and assign roles
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = db.getUsers().find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
    }

    const newUser = db.createUser(tenantId, {
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone,
    });

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'USER_CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      details: `Created staff user '${newUser.name}' with role '${newUser.role}' (${newUser.email})`,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId || 'tenant-1';
    const { id, action, isActive, ...updates } = body;

    // Server authorization check: Only OWNER can modify staff roles and statuses
    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (action === 'TOGGLE_STATUS' && isActive !== undefined) {
      const updated = db.toggleUserStatus(tenantId, id, Boolean(isActive));
      if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      db.recordAuditEvent({
        tenantId,
        actorId: auth.user!.id,
        actorName: auth.user!.name,
        actorRole: auth.user!.role,
        action: isActive ? 'USER_CREATE' : 'USER_DEACTIVATE',
        entityType: 'USER',
        entityId: id,
        details: `${isActive ? 'Activated' : 'Deactivated'} account for staff '${updated.name}'`,
      });

      return NextResponse.json({
        user: updated,
        message: `User account has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    }

    // Check if role is changing
    if (updates.role) {
      const user = db.getUserById(id);
      if (user && user.role !== updates.role) {
        db.updateUserRole(id, updates.role, auth.user!.id);
      }
    }

    const updated = db.updateUser(tenantId, id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated, message: 'User updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const tenantId = body.tenantId || searchParams.get('tenantId') || 'tenant-1';
    const id = body.id || searchParams.get('id');

    const auth = authorizeServerRequest(request, 'STAFF_ROLES_SCHEDULES', 'FULL', tenantId);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const success = db.deleteUser(tenantId, id);
    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    db.recordAuditEvent({
      tenantId,
      actorId: auth.user!.id,
      actorName: auth.user!.name,
      actorRole: auth.user!.role,
      action: 'USER_DEACTIVATE',
      entityType: 'USER',
      entityId: id,
      details: `Removed user account '${id}' from organization`,
    });

    return NextResponse.json({ success: true, message: 'Staff user removed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete staff user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
